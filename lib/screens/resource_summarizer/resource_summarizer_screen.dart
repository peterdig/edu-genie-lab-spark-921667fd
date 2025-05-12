import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:path/path.dart' as path;
import 'package:dio/dio.dart';
import 'package:mime/mime.dart';
import 'package:http_parser/http_parser.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';

class ResourceSummarizerScreen extends StatefulWidget {
  const ResourceSummarizerScreen({super.key});

  @override
  State<ResourceSummarizerScreen> createState() => _ResourceSummarizerScreenState();
}

class _ResourceSummarizerScreenState extends State<ResourceSummarizerScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _youtubeLinkController = TextEditingController();
  final _titleController = TextEditingController();
  bool _isProcessing = false;
  
  // File related variables
  File? _selectedFile;
  PlatformFile? _platformFile;
  Uint8List? _webFileBytes;
  String? _fileName;
  String? _fileType;
  
  String? _generatedSummary;
  String? _generatedNotes;
  String? _currentTitle;
  final _auth = FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;
  late TabController _tabController;
  final dio = Dio();

  // API endpoint configuration
  String get apiBaseUrl {
    if (kIsWeb) {
      // For web deployment
      return 'http://localhost:8000';
    } else {
      // For desktop/mobile
      if (Platform.isAndroid) {
        // Android emulator needs special IP for localhost
        return 'http://10.0.2.2:8000';
      } else {
        return 'http://localhost:8000';
      }
    }
  }

  // Add state variable to track content height adjustment
  double _contentHeightFactor = 0.6; // Default to 60% of screen height

  // Add state variable to track history content height adjustment
  double _historyHeightFactor = 0.5; // Default to 50% of screen height

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _youtubeLinkController.dispose();
    _titleController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null) {
      setState(() {
        _platformFile = result.files.first;
        _fileName = _platformFile!.name;
        _fileType = 'pdf';
        
        if (kIsWeb) {
          // Handle web files differently
          _webFileBytes = _platformFile!.bytes;
          _selectedFile = null;
        } else {
          // Handle desktop/mobile files
          _selectedFile = File(_platformFile!.path!);
          _webFileBytes = null;
        }
        
        _titleController.text = _fileName ?? 'Document';
      });
    }
  }

  Future<void> _summarizeResource() async {
    if (!_formKey.currentState!.validate()) return;

    if (_platformFile == null && _youtubeLinkController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a PDF file or enter a YouTube URL')),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
      _generatedSummary = null;
      _generatedNotes = null;
    });

    try {
      // Get Firebase token
      final token = await _auth.currentUser?.getIdToken();
      if (token == null) {
        throw Exception('User not authenticated');
      }

      final formData = FormData();
      
      if (_platformFile != null) {
        // Add PDF file
        if (kIsWeb) {
          // Handle web file upload
          formData.files.add(
            MapEntry(
              'file',
              MultipartFile.fromBytes(
                _webFileBytes!,
                filename: _fileName,
                contentType: MediaType('application', 'pdf'),
              ),
            ),
          );
        } else {
          // Handle desktop/mobile file upload
          formData.files.add(
            MapEntry(
              'file',
              await MultipartFile.fromFile(
                _selectedFile!.path,
                filename: _fileName,
                contentType: MediaType('application', 'pdf'),
              ),
            ),
          );
        }
      } else if (_youtubeLinkController.text.isNotEmpty) {
        // Add YouTube link
        formData.fields.add(
          MapEntry('youtube_url', _youtubeLinkController.text),
        );
      }

      // Add title and token
      formData.fields.add(MapEntry('token', token));
      formData.fields.add(MapEntry('title', _titleController.text));

      // Set timeout and retry options
      final options = Options(
        contentType: 'multipart/form-data',
        sendTimeout: const Duration(minutes: 2),
        receiveTimeout: const Duration(minutes: 2),
      );

      // Call FastAPI backend
      try {
        final response = await dio.post(
          '$apiBaseUrl/api/summarize-resource',
          data: formData,
          options: options,
        );

        if (response.statusCode != 200) {
          throw Exception('Failed to generate summary: ${response.data}');
        }

        final data = response.data;
        setState(() {
          _currentTitle = data['title'];
          _generatedSummary = data['summary'];
          _generatedNotes = data['notes'];
          _isProcessing = false;
        });
      } on DioException catch (e) {
        // Handle Dio-specific errors
        String errorMessage = 'Connection error';
        if (e.response != null) {
          // Server responded with an error
          if (e.response!.data is Map && e.response!.data['detail'] != null) {
            errorMessage = 'Server error: ${e.response!.data['detail']}';
          } else {
            errorMessage = 'Server error: ${e.response!.statusCode}';
          }
        } else if (e.type == DioExceptionType.connectionTimeout) {
          errorMessage = 'Connection timeout - Server may be offline';
        } else if (e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Response timeout - PDF processing may be taking too long';
        } else {
          errorMessage = 'Network error: ${e.message}';
        }
        
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage)),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error generating summary: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height - MediaQuery.of(context).padding.vertical,
            ),
            child: IntrinsicHeight(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Upload form
                    _buildUploadForm(),
                    const SizedBox(height: 16),
                    
                    // Results or history - Use Expanded inside IntrinsicHeight
                    Expanded(
                      child: _isProcessing
                          ? const Center(child: CircularProgressIndicator())
                          : _generatedSummary != null
                              ? _buildResultTabs()
                              : _buildSummaryHistory(),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUploadForm() {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Create Summary',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              // Resource selection options
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _pickFile,
                      icon: const Icon(Icons.upload_file),
                      label: const Text('Upload PDF'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _fileName != null
                        ? Row(
                            children: [
                              const Icon(Icons.check_circle, color: Colors.green),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _fileName!,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  setState(() {
                                    _selectedFile = null;
                                    _webFileBytes = null;
                                    _platformFile = null;
                                    _fileName = null;
                                  });
                                },
                              ),
                            ],
                          )
                        : const Text('No file selected'),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              const Center(child: Text('OR')),
              const SizedBox(height: 16),
              
              // YouTube URL input
              TextFormField(
                controller: _youtubeLinkController,
                decoration: const InputDecoration(
                  labelText: 'YouTube Video URL',
                  hintText: 'https://www.youtube.com/watch?v=...',
                  prefixIcon: Icon(Icons.link),
                ),
                enabled: _platformFile == null,
              ),
              
              const SizedBox(height: 16),
              
              // Optional title
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title (Optional)',
                  hintText: 'Custom title for your summary',
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Submit button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _summarizeResource,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Generate Summary'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultTabs() {
    // Calculate a responsive height based on screen size and adjustment factor
    final screenHeight = MediaQuery.of(context).size.height;
    final contentHeight = screenHeight * _contentHeightFactor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title and actions
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                _currentTitle ?? 'Summary',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Row(
              children: [
                // Height adjustment controls
                IconButton(
                  icon: const Icon(Icons.expand_less),
                  tooltip: 'Decrease height',
                  onPressed: () {
                    setState(() {
                      // Decrease height factor, but don't go below 0.3
                      _contentHeightFactor = (_contentHeightFactor - 0.1).clamp(0.3, 0.9);
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.expand_more),
                  tooltip: 'Increase height',
                  onPressed: () {
                    setState(() {
                      // Increase height factor, but don't exceed 0.9
                      _contentHeightFactor = (_contentHeightFactor + 0.1).clamp(0.3, 0.9);
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.share),
                  tooltip: 'Share',
                  onPressed: () {
                    _showShareOptions();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                  onPressed: () {
                    setState(() {
                      _generatedSummary = null;
                      _generatedNotes = null;
                      _currentTitle = null;
                    });
                  },
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        
        // Tabs
        TabBar(
          controller: _tabController,
          labelColor: Theme.of(context).colorScheme.primary,
          indicatorColor: Theme.of(context).colorScheme.primary,
          dividerColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
          tabs: const [
            Tab(text: 'Summary'),
            Tab(text: 'Teaching Notes'),
          ],
        ),
        const SizedBox(height: 16),
        
        // Tab content - Use AnimatedContainer for smooth height transitions
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          height: contentHeight,
          child: TabBarView(
            controller: _tabController,
            children: [
              // Summary tab
              _buildExpandableContent(_generatedSummary ?? ''),
              
              // Teaching notes tab
              _buildExpandableContent(_generatedNotes ?? ''),
            ],
          ),
        ),
      ],
    );
  }
  
  // New widget specifically for expandable content viewing
  Widget _buildExpandableContent(String content) {
    final scrollController = ScrollController();
    
    return Stack(
      children: [
        Card(
          elevation: 0,
          color: Theme.of(context).colorScheme.surface,
          margin: EdgeInsets.zero,
          child: _buildContentViewer(content, scrollController),
        ),
        
        // Scroll to top button - appears when scrolled down
        Positioned(
          right: 8,
          bottom: 70, // Position above the copy button
          child: AnimatedBuilder(
            animation: scrollController,
            builder: (context, child) {
              return scrollController.hasClients && scrollController.offset > 300
                ? FloatingActionButton.small(
                    heroTag: null,
                    onPressed: () {
                      scrollController.animateTo(
                        0,
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOut,
                      );
                    },
                    tooltip: 'Scroll to top',
                    child: const Icon(Icons.arrow_upward),
                  )
                : const SizedBox.shrink();
            },
          ),
        ),
        
        // Full-screen button
        Positioned(
          right: 8,
          bottom: 130, // Position above the scroll-to-top button
          child: FloatingActionButton.small(
            heroTag: null,
            onPressed: () {
              _showFullScreenContent(content);
            },
            tooltip: 'Expand view',
            child: const Icon(Icons.fullscreen),
          ),
        ),
      ],
    );
  }

  // Updated to accept a scrollController
  Widget _buildContentViewer(String content, [ScrollController? scrollController]) {
    if (content.trim().isEmpty) {
      return const Center(
        child: Text('No content available'),
      );
    }
    
    // Process the markdown content for basic styling
    final lines = content.split('\n');
    final processedLines = <Widget>[];
    
    // For tracking numbered lists
    final RegExp numberedListRegex = RegExp(r'^\d+\.\s');
    
    for (final line in lines) {
      if (line.startsWith('# ')) {
        // h1 heading
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(top: 16.0, bottom: 8.0),
            child: SelectableText.rich(
              _processTextFormatting(
                line.substring(2),
                TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
          ),
        );
      } else if (line.startsWith('## ')) {
        // h2 heading
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(top: 16.0, bottom: 8.0),
            child: SelectableText.rich(
              _processTextFormatting(
                line.substring(3),
                TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
          ),
        );
      } else if (line.startsWith('### ')) {
        // h3 heading
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(top: 12.0, bottom: 8.0),
            child: SelectableText.rich(
              _processTextFormatting(
                line.substring(4),
                const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        );
      } else if (line.startsWith('- ')) {
        // bullet point
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 4.0, bottom: 4.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Expanded(
                  child: SelectableText.rich(
                    _processTextFormatting(
                      line.substring(2),
                      const TextStyle(
                        fontSize: 16,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else if (line.startsWith('* ')) {
        // bullet point with asterisk
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 4.0, bottom: 4.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                  child: Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Expanded(
                  child: SelectableText.rich(
                    _processTextFormatting(
                      line.substring(2),
                      const TextStyle(
                        fontSize: 16,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else if (numberedListRegex.hasMatch(line)) {
        // Numbered list item
        final match = numberedListRegex.firstMatch(line);
        final number = match!.group(0)!;
        final text = line.substring(number.length);
        
        processedLines.add(
          Padding(
            padding: const EdgeInsets.only(left: 16.0, top: 4.0, bottom: 4.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 24,
                  child: SelectableText(
                    number,
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.5,
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Expanded(
                  child: SelectableText.rich(
                    _processTextFormatting(
                      text,
                      const TextStyle(
                        fontSize: 16,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      } else if (line.trim().isEmpty) {
        // Empty line
        processedLines.add(const SizedBox(height: 8));
      } else {
        // Regular paragraph
        processedLines.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4.0),
            child: SelectableText.rich(
              _processTextFormatting(
                line,
                const TextStyle(
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
            ),
          ),
        );
      }
    }
    
    return Stack(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Expandable Content Area
                ...processedLines,
                // Add space at bottom for FABs
                const SizedBox(height: 70),
              ],
            ),
          ),
        ),
        Positioned(
          right: 8,
          bottom: 8,
          child: FloatingActionButton.small(
            heroTag: null,
            onPressed: () {
              _copyContentToClipboard(content);
            },
            tooltip: 'Copy to clipboard',
            child: const Icon(Icons.copy),
          ),
        ),
      ],
    );
  }

  void _copyContentToClipboard(String content) {
    Clipboard.setData(ClipboardData(text: content)).then((_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Content copied to clipboard')),
      );
    });
  }

  void _showShareOptions() {
    final currentTab = _tabController.index;
    final content = currentTab == 0 ? _generatedSummary : _generatedNotes;
    final title = _currentTitle ?? 'EduPrep AI Summary';
    
    if (content == null || content.isEmpty) return;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Share $title',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildShareOption(
                    icon: Icons.copy,
                    label: 'Copy',
                    onTap: () {
                      Navigator.pop(context);
                      _copyContentToClipboard(content);
                    },
                  ),
                  _buildShareOption(
                    icon: Icons.download,
                    label: 'Save as PDF',
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('PDF export coming soon')),
                      );
                    },
                  ),
                  _buildShareOption(
                    icon: Icons.email,
                    label: 'Email',
                    onTap: () {
                      Navigator.pop(context);
                      _launchEmailWithContent(title, content);
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildShareOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchEmailWithContent(String subject, String content) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      query: 'subject=$subject&body=${Uri.encodeComponent(content)}',
    );
    
    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch email client')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error launching email: $e')),
      );
    }
  }

  Widget _buildSummaryHistory() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) {
      return const Center(
        child: Text('Please login to view your summaries'),
      );
    }

    // Calculate responsive height
    final screenHeight = MediaQuery.of(context).size.height;
    final contentHeight = screenHeight * _historyHeightFactor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title and height adjustment controls
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Summaries',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.expand_less),
                  tooltip: 'Decrease height',
                  iconSize: 20,
                  constraints: const BoxConstraints(
                    minWidth: 36,
                    minHeight: 36,
                  ),
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    setState(() {
                      // Decrease height factor, but don't go below 0.2
                      _historyHeightFactor = (_historyHeightFactor - 0.1).clamp(0.2, 0.8);
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.expand_more),
                  tooltip: 'Increase height',
                  iconSize: 20,
                  constraints: const BoxConstraints(
                    minWidth: 36,
                    minHeight: 36,
                  ),
                  padding: EdgeInsets.zero,
                  onPressed: () {
                    setState(() {
                      // Increase height factor, but don't exceed 0.8
                      _historyHeightFactor = (_historyHeightFactor + 0.1).clamp(0.2, 0.8);
                    });
                  },
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          height: contentHeight,
          child: StreamBuilder<QuerySnapshot>(
            stream: _firestore
                .collection('users/$userId/summaries')
                .orderBy('createdAt', descending: true)
                .limit(10)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              final summaries = snapshot.data?.docs ?? [];
              
              if (summaries.isEmpty) {
                return Center(
                  child: SingleChildScrollView(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 300),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.summarize_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No summaries created yet'),
                          SizedBox(height: 8),
                          Text(
                            'Upload a document or video to create your first summary',
                            style: TextStyle(color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }
              
              return ListView.builder(
                itemCount: summaries.length,
                itemBuilder: (context, index) {
                  final summary = summaries[index].data() as Map<String, dynamic>;
                  final contentType = summary['contentType'] as String? ?? 'pdf';
                  
                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                        child: Icon(
                          contentType == 'pdf' ? Icons.picture_as_pdf : Icons.video_library,
                          color: Theme.of(context).colorScheme.secondary,
                        ),
                      ),
                      title: Text(
                        summary['title'] ?? 'Untitled',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(
                        'Created ${_formatDate(summary['createdAt'])}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () {
                        setState(() {
                          _currentTitle = summary['title'];
                          _generatedSummary = summary['summary'];
                          _generatedNotes = summary['notes'];

                          // Handle potential null or empty content
                          if (_generatedSummary == null || _generatedSummary!.trim().isEmpty) {
                            _generatedSummary = '# Summary\n\nNo summary content available.';
                          }
                          
                          if (_generatedNotes == null || _generatedNotes!.trim().isEmpty) {
                            _generatedNotes = '## Teaching Notes\n\nNo teaching notes available.';
                          }
                        });
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  String _formatDate(String? isoString) {
    if (isoString == null) return 'Unknown date';
    try {
      final date = DateTime.parse(isoString);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inDays == 0) {
        return 'Today';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return 'Unknown date';
    }
  }

  // Helper method to process basic markdown formatting within text
  TextSpan _processTextFormatting(String text, TextStyle baseStyle) {
    final List<TextSpan> children = [];
    
    // Handle bold and italic formatting
    final RegExp boldItalicRegex = RegExp(r'\*\*\*(.*?)\*\*\*');
    final RegExp boldRegex = RegExp(r'\*\*(.*?)\*\*');
    final RegExp italicRegex = RegExp(r'\*(.*?)\*');
    
    // Current position in the text
    int currentPosition = 0;
    
    // Process bold+italic first (***text***)
    final boldItalicMatches = boldItalicRegex.allMatches(text).toList();
    for (final match in boldItalicMatches) {
      // Add text before the match
      if (match.start > currentPosition) {
        children.add(TextSpan(
          text: text.substring(currentPosition, match.start),
          style: baseStyle,
        ));
      }
      
      // Add the bold+italic text
      children.add(TextSpan(
        text: match.group(1),
        style: baseStyle.copyWith(
          fontWeight: FontWeight.bold,
          fontStyle: FontStyle.italic,
        ),
      ));
      
      currentPosition = match.end;
    }
    
    // If there were no bold+italic matches, process bold and italic separately
    if (boldItalicMatches.isEmpty) {
      // Process bold text (**text**)
      final boldMatches = boldRegex.allMatches(text).toList();
      for (final match in boldMatches) {
        // Add text before the match
        if (match.start > currentPosition) {
          children.add(TextSpan(
            text: text.substring(currentPosition, match.start),
            style: baseStyle,
          ));
        }
        
        // Add the bold text
        children.add(TextSpan(
          text: match.group(1),
          style: baseStyle.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ));
        
        currentPosition = match.end;
      }
      
      // Process italic text (*text*)
      if (boldMatches.isEmpty) {
        final italicMatches = italicRegex.allMatches(text).toList();
        for (final match in italicMatches) {
          // Add text before the match
          if (match.start > currentPosition) {
            children.add(TextSpan(
              text: text.substring(currentPosition, match.start),
              style: baseStyle,
            ));
          }
          
          // Add the italic text
          children.add(TextSpan(
            text: match.group(1),
            style: baseStyle.copyWith(
              fontStyle: FontStyle.italic,
            ),
          ));
          
          currentPosition = match.end;
        }
      }
    }
    
    // Add any remaining text
    if (currentPosition < text.length) {
      children.add(TextSpan(
        text: text.substring(currentPosition),
        style: baseStyle,
      ));
    }
    
    // If no formatting was found, return the original text
    if (children.isEmpty) {
      return TextSpan(text: text, style: baseStyle);
    }
    
    return TextSpan(children: children, style: baseStyle);
  }

  // New method to show content in full screen
  void _showFullScreenContent(String content) {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(_currentTitle ?? 'Content'),
            actions: [
              IconButton(
                icon: const Icon(Icons.copy),
                tooltip: 'Copy to clipboard',
                onPressed: () {
                  _copyContentToClipboard(content);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Content copied to clipboard')),
                  );
                },
              ),
            ],
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: _buildContentViewer(content),
            ),
          ),
        ),
      ),
    );
  }
} 