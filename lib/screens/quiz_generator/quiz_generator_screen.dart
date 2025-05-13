import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;

class QuizGeneratorScreen extends StatefulWidget {
  const QuizGeneratorScreen({super.key});

  @override
  State<QuizGeneratorScreen> createState() => _QuizGeneratorScreenState();
}

class _QuizGeneratorScreenState extends State<QuizGeneratorScreen> {
  final TextEditingController _contentController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _youtubeUrlController = TextEditingController();
  int _questionCount = 5;
  bool _isLoading = false;
  bool _showQuiz = false;
  List<Map<String, dynamic>> _generatedQuestions = [];
  String _selectedInputType = 'text'; // 'text', 'pdf', or 'youtube'
  bool _includeAnswers = true;
  bool _includeBloomTags = true;
  String _quizTitle = '';
  
  PlatformFile? _selectedFile;
  Uint8List? _selectedFileBytes;
  String? _youtubeUrl;
  bool _isPdfExporting = false;

  // Helper to determine the correct base URL for the API
  String get _apiBaseUrl {
    // --- IMPORTANT FOR PHYSICAL DEVICE TESTING ---
    // 1. Find your laptop's local network IP address (e.g., 192.168.1.101).
    // 2. Replace "YOUR_LAPTOP_IP" with that address.
    // 3. Ensure your phone and laptop are on the SAME Wi-Fi network.
    // 4. Ensure your laptop's firewall allows connections on port 8000.
    const String myLaptopIp = "YOUR_LAPTOP_IP"; // <<< REPLACE THIS!
    // --- IMPORTANT FOR PHYSICAL DEVICE TESTING ---

    if (kDebugMode && myLaptopIp != "YOUR_LAPTOP_IP" && !kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
        // When testing on a physical device, and you've set your IP
        print("Using custom IP for physical device: http://$myLaptopIp:8000");
        return 'http://$myLaptopIp:8000';
    }

    if (kIsWeb) {
      return 'http://localhost:8000';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000';
    } else if (Platform.isIOS) {
      return 'http://localhost:8000';
    } else {
      print(
          'Warning: Platform not explicitly handled for API URL. Defaulting to localhost. Consider setting myLaptopIp for physical devices.');
      return 'http://localhost:8000';
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    _titleController.dispose();
    _youtubeUrlController.dispose();
    super.dispose();
  }

  Future<String?> _getAuthToken() async {
    try {
      User? user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        return await user.getIdToken();
      }
    } catch (e) {
      debugPrint('Error getting auth token: $e');
    }
    return null;
  }

  Future<void> _generateQuiz() async {
    // Validate inputs
    if (_selectedInputType == 'text' && _contentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter some content')),
      );
      return;
    }

    if (_selectedInputType == 'pdf' && _selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a PDF file')),
      );
      return;
    }

    if (_selectedInputType == 'youtube') {
      final url = _youtubeUrlController.text.trim();
      if (url.isEmpty || 
         (!url.contains('youtube.com/watch?v=') && 
          !url.contains('youtu.be/'))) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a valid YouTube URL')),
        );
        return;
      }
    }

    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title for your quiz')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final String? token = await _getAuthToken();
    if (token == null) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication error. Please try logging in again.')),
        );
      }
      return;
    }

    try {
      http.Response response;
      
      if (_selectedInputType == 'text') {
        // Direct text input
        final url = '$_apiBaseUrl/api/generate-quiz';
        final payload = {
          'content': _contentController.text,
          'numQuestions': _questionCount,
          'token': token,
          'title': _titleController.text,
        };
        
        response = await http.post(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json'},
          body: json.encode(payload),
        );
      } else {
        // File or YouTube URL
        final url = '$_apiBaseUrl/api/generate-quiz-from-file';
        var request = http.MultipartRequest('POST', Uri.parse(url));
        
        // Add common fields
        request.fields['num_questions'] = _questionCount.toString();
        request.fields['token'] = token;
        request.fields['title'] = _titleController.text;

        if (_selectedInputType == 'pdf' && _selectedFile != null) {
          // Add file - handle differently for web
          if (kIsWeb) {
            if (_selectedFileBytes != null) {
              request.files.add(
                http.MultipartFile.fromBytes(
                  'file', 
                  _selectedFileBytes!,
                  filename: _selectedFile!.name
                )
              );
            }
          } else {
            // For non-web platforms, use path
            if (_selectedFile!.path != null) {
              request.files.add(
                await http.MultipartFile.fromPath('file', _selectedFile!.path!)
              );
            }
          }
        } else if (_selectedInputType == 'youtube') {
          // Add YouTube URL
          request.fields['youtube_url'] = _youtubeUrlController.text;
        }
        
        // Send the request
        final streamedResponse = await request.send();
        response = await http.Response.fromStream(streamedResponse);
      }

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        
        setState(() {
          _generatedQuestions = List<Map<String, dynamic>>.from(
            (result['questions'] as List).map((q) => {
              'question': q['question'],
              'options': List<Map<String, dynamic>>.from(
                (q['options'] as List).map((o) => {
                  'id': o['id'],
                  'text': o['text']
                })
              ),
              'correctAnswer': q['correctAnswer'],
              'bloomTag': q['bloomTag']
            })
          );
          _quizTitle = result['title'];
          _isLoading = false;
          _showQuiz = true;
        });

        // Save to Firestore directly here instead of relying on backend
        try {
          User? user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            await FirebaseFirestore.instance
                .collection('users')
                .doc(user.uid)
                .collection('quizzes')
                .add({
                  'title': _quizTitle,
                  'questions': _generatedQuestions,
                  'createdAt': FieldValue.serverTimestamp(),
                  'userId': user.uid,
                  'sourceType': _selectedInputType,
                  'pdfExported': false
                });
          }
        } catch (e) {
          debugPrint('Error saving to Firestore: $e');
          // Continue even if Firestore save fails
        }
      } else {
        throw Exception('Failed to generate quiz: ${response.body}');
      }
    } catch (e) {
      debugPrint('Error generating quiz: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating quiz: $e')),
        );
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: true, // Important for web platforms
      );

      if (result != null) {
        setState(() {
          _selectedFile = result.files.first;
          _selectedFileBytes = result.files.first.bytes;
        });
      }
    } catch (e) {
      debugPrint('Error picking file: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking file: $e')),
        );
      }
    }
  }

  Future<void> _generatePdf() async {
    setState(() {
      _isPdfExporting = true;
    });
    
    try {
      final pdf = pw.Document();
      
      // Load fonts
      final font = await PdfGoogleFonts.nunitoRegular();
      final fontBold = await PdfGoogleFonts.nunitoBold();
      
      // Add content to PDF
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          header: (context) => pw.Text(
            _quizTitle,
            style: pw.TextStyle(
              font: fontBold,
              fontSize: 18,
            ),
          ),
          footer: (context) => pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.end,
        children: [
              pw.Text(
                'Page ${context.pageNumber} of ${context.pagesCount}',
                style: pw.TextStyle(
                  font: font,
                  fontSize: 10,
                  color: PdfColors.grey700,
                ),
              ),
            ],
          ),
          build: (context) => [
            pw.Header(
              level: 1,
              text: 'Multiple Choice Questions',
              textStyle: pw.TextStyle(
                font: fontBold,
                fontSize: 16,
              ),
            ),
            pw.SizedBox(height: 20),
            ..._generatedQuestions.asMap().entries.map((entry) {
              final index = entry.key;
              final question = entry.value;
              
              return pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    '${index + 1}. ${question['question']}',
                    style: pw.TextStyle(
                      font: fontBold,
                      fontSize: 12,
                    ),
                  ),
                  if (_includeBloomTags) pw.Text(
                    'Bloom\'s Level: ${question['bloomTag']}',
                    style: pw.TextStyle(
                      font: font,
                      fontSize: 10,
                      fontStyle: pw.FontStyle.italic,
                      color: PdfColors.blue700,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  ...List<Map<String, dynamic>>.from(question['options']).map((option) {
                    final isCorrect = option['id'] == question['correctAnswer'];
                    
                    return pw.Padding(
                      padding: const pw.EdgeInsets.only(bottom: 5),
                      child: pw.Row(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Container(
                            width: 20,
                            child: pw.Text(
                              '${option['id']}.',
                              style: pw.TextStyle(
                                font: fontBold,
                                fontSize: 11,
                                color: _includeAnswers && isCorrect ? PdfColors.green700 : PdfColors.black,
                              ),
                            ),
                          ),
                          pw.Expanded(
                            child: pw.Text(
                              option['text'],
                              style: pw.TextStyle(
                                font: font,
                                fontSize: 11,
                                color: _includeAnswers && isCorrect ? PdfColors.green700 : PdfColors.black,
                              ),
                            ),
                          ),
                          if (_includeAnswers && isCorrect)
                            pw.Container(
                              width: 15,
                              child: pw.Text(
                                '*',
                                style: pw.TextStyle(
                                  font: fontBold,
                                  fontSize: 14,
                                  color: PdfColors.green700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                  if (_includeAnswers) pw.Padding(
                    padding: const pw.EdgeInsets.only(top: 5),
                    child: pw.Text(
                      'Correct answer: ${question['correctAnswer']}',
                      style: pw.TextStyle(
                        font: fontBold,
                        fontSize: 10,
                        color: PdfColors.green700,
                      ),
                    ),
                  ),
                  pw.SizedBox(height: 20),
                ],
              );
            }).toList(),
          ],
        ),
      );
      
      // Print the document
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
        name: _quizTitle,
      );
      
      // Update pdfExported flag in the quiz document
      try {
        User? user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          // Instead of using a complex query, we'll get all recent quizzes and filter manually
          final querySnapshot = await FirebaseFirestore.instance
              .collection('users')
              .doc(user.uid)
              .collection('quizzes')
              .orderBy('createdAt', descending: true)
              .limit(10)
              .get();
          
          for (var doc in querySnapshot.docs) {
            final data = doc.data();
            if (data['title'] == _quizTitle) {
              await doc.reference.update({
                'pdfExported': true,
              });
              break;
            }
          }
        }
      } catch (e) {
        debugPrint('Error updating Firestore: $e');
        // Continue even if Firestore update fails
      }
    } catch (e) {
      debugPrint('Error generating PDF: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error generating PDF: $e')),
        );
      }
    } finally {
      setState(() {
        _isPdfExporting = false;
      });
    }
  }

  Widget _buildInputSection() {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Create Quiz',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            
            // Quiz title
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Quiz Title',
                border: OutlineInputBorder(),
                hintText: 'Enter a title for your quiz',
              ),
            ),
            const SizedBox(height: 16),
            
            // Input type selector
            Row(
              children: [
                const Text('Input Type: ', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('Text'),
                  selected: _selectedInputType == 'text',
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedInputType = 'text';
                      });
                    }
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('PDF'),
                  selected: _selectedInputType == 'pdf',
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedInputType = 'pdf';
                      });
                    }
                  },
                ),
                const SizedBox(width: 8),
                ChoiceChip(
                  label: const Text('YouTube'),
                  selected: _selectedInputType == 'youtube',
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedInputType = 'youtube';
                      });
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Dynamic input based on selected type
            if (_selectedInputType == 'text')
              TextField(
                controller: _contentController,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: 'Content',
                  border: OutlineInputBorder(),
                  hintText: 'Enter or paste content to generate quiz questions',
                ),
              )
            else if (_selectedInputType == 'pdf')
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _selectedFile == null 
                        ? 'No file selected' 
                        : 'Selected: ${_selectedFile!.name}',
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: _pickFile,
                    icon: const Icon(Icons.upload_file),
                    label: const Text('Select PDF'),
                  ),
                ],
              )
            else if (_selectedInputType == 'youtube')
              TextField(
                controller: _youtubeUrlController,
                decoration: const InputDecoration(
                  labelText: 'YouTube URL',
                  border: OutlineInputBorder(),
                  hintText: 'Enter YouTube video URL (e.g., https://youtube.com/watch?v=xxxxx)',
                ),
              ),
            
            const SizedBox(height: 24),
            
            // Question count slider
            Row(
              children: [
                const Text('Number of Questions: ', style: TextStyle(fontWeight: FontWeight.bold)),
                Expanded(
                  child: Slider(
                    value: _questionCount.toDouble(),
                    min: 1,
                    max: 10,
                    divisions: 9,
                    label: _questionCount.toString(),
                    onChanged: (value) {
                      setState(() {
                        _questionCount = value.toInt();
                      });
                    },
                  ),
                ),
                Text('$_questionCount', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            
          const SizedBox(height: 24),
            
            // Generate button
            Center(
              child: SizedBox(
                width: 200,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _generateQuiz,
                  icon: const Icon(Icons.quiz),
                  label: const Text('Generate Quiz'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuizView() {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _quizTitle,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit),
                      tooltip: 'Create New Quiz',
            onPressed: () {
                        setState(() {
                          _showQuiz = false;
                          _contentController.clear();
                          _titleController.clear();
                          _youtubeUrlController.clear();
                          _selectedFile = null;
                          _selectedFileBytes = null;
                        });
                      },
                    ),
                    IconButton(
                      icon: _isPdfExporting 
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.picture_as_pdf),
                      tooltip: 'Export to PDF',
                      onPressed: _isPdfExporting ? null : _generatePdf,
                    ),
                  ],
                ),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            
            // PDF export options
            Row(
              children: [
                const Text('Export Options: ', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                Row(
                  children: [
                    Checkbox(
                      value: _includeAnswers,
                      onChanged: (value) {
                        setState(() {
                          _includeAnswers = value ?? true;
                        });
                      },
                    ),
                    const Text('Include Answers'),
                  ],
                ),
                const SizedBox(width: 16),
                Row(
                  children: [
                    Checkbox(
                      value: _includeBloomTags,
                      onChanged: (value) {
                        setState(() {
                          _includeBloomTags = value ?? true;
                        });
                      },
                    ),
                    const Text('Include Bloom Tags'),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Questions list
            Expanded(
              child: ListView.builder(
                itemCount: _generatedQuestions.length,
                itemBuilder: (context, index) {
                  final question = _generatedQuestions[index];
                  final options = List<Map<String, dynamic>>.from(question['options']);
                  
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    color: Theme.of(context).colorScheme.surface,
                    elevation: 1,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${index + 1}. ',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  question['question'],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primaryContainer,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Bloom\'s Level: ${question['bloomTag']}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Theme.of(context).colorScheme.onPrimaryContainer,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...options.map((option) {
                            final isCorrect = option['id'] == question['correctAnswer'];
                            
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isCorrect 
                                          ? Theme.of(context).colorScheme.primary
                                          : Theme.of(context).colorScheme.surfaceVariant,
                                    ),
                                    child: Center(
                                      child: Text(
                                        option['id'],
                                        style: TextStyle(
                                          color: isCorrect 
                                              ? Theme.of(context).colorScheme.onPrimary
                                              : Theme.of(context).colorScheme.onSurfaceVariant,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      option['text'],
                                      style: TextStyle(
                                        color: isCorrect 
                                            ? Theme.of(context).colorScheme.primary
                                            : null,
                                        fontWeight: isCorrect ? FontWeight.bold : null,
                                      ),
                                    ),
                                  ),
                                  if (isCorrect)
                                    Icon(
                                      Icons.check_circle,
                                      color: Theme.of(context).colorScheme.primary,
                                    ),
                                ],
                              ),
                            );
                          }).toList(),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(
                  'Generating quiz questions...',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          )
        : _showQuiz
            ? _buildQuizView()
            : _buildInputSection();
  }
} 