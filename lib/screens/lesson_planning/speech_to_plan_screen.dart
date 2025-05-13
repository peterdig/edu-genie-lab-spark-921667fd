// Screen for Speech-to-Plan feature
import 'package:flutter/material.dart';
import '../../services/speech_to_text_service.dart'; 
import '../../services/lesson_plan_service.dart'; // Added for lesson plan service
import 'package:flutter/foundation.dart' show kDebugMode;

class SpeechToPlanScreen extends StatefulWidget {
  const SpeechToPlanScreen({super.key});

  @override
  State<SpeechToPlanScreen> createState() => _SpeechToPlanScreenState();
}

class _SpeechToPlanScreenState extends State<SpeechToPlanScreen> {
  bool _isListening = false;
  String _transcript = 'Press the mic and start speaking...';
  String _lessonPlan = '';
  final TextEditingController _lessonPlanController = TextEditingController();

  // Speech Service
  late final SpeechToTextService _speechService;
  bool _speechAvailable = false;

  // Lesson Plan Service
  late final LessonPlanService _lessonPlanService;
  bool _isGeneratingPlan = false;
  bool _isSavingPlan = false;

  @override
  void initState() {
    super.initState();
    _speechService = SpeechToTextService();
    _initializeSpeechService();
    _lessonPlanService = LessonPlanService(); // Initialize LessonPlanService
  }

  Future<void> _initializeSpeechService() async {
    _speechAvailable = await _speechService.initialize();
    if (mounted) {
      setState(() {});
    }
  }

  void _toggleListening() {
    if (!_speechAvailable) {
      if (kDebugMode) {
        print("Speech recognition not available.");
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Speech recognition not available or permission denied.')),
      );
      return;
    }

    if (_speechService.isListening) {
      _speechService.stopListening(onListeningStatusChanged: (isListening) {
        if (mounted) {
          setState(() => _isListening = isListening);
        }
      });
    } else {
      setState(() {
        _transcript = ''; // Clear previous transcript
      });
      _speechService.startListening(
        onResult: (text) {
          if (mounted) {
            setState(() {
              _transcript = text;
            });
          }
        },
        onListeningStatusChanged: (isListening) {
          if (mounted) {
            setState(() => _isListening = isListening);
          }
          // Handle listening timeout or end of speech if not final result
          if (!isListening && _transcript.isEmpty && _speechService.isListening == false) {
            if (mounted) {
              setState(() {
                _transcript = 'No speech detected or listening timed out.';
              });
            }
          }
        },
      );
    }
  }

  void _generatePlan() async {
    if (_transcript.isEmpty || _transcript.startsWith('Press the mic') || _transcript.startsWith('No speech detected')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please record a valid lesson idea first.')),
      );
      return;
    }
    setState(() {
      _isGeneratingPlan = true;
      _lessonPlan = ''; // Clear previous plan
      _lessonPlanController.text = '';
    });

    final result = await _lessonPlanService.generateLessonPlan(_transcript);

    if (mounted) {
      setState(() {
        if (result != null && !result.startsWith('Error:')) {
          _lessonPlan = result;
          _lessonPlanController.text = result;
        } else {
          _lessonPlan = result ?? 'An unknown error occurred.';
          _lessonPlanController.text = _lessonPlan; // Show error in text field as well
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result ?? 'Failed to generate plan.')),
          );
        }
        _isGeneratingPlan = false;
      });
    }
  }

  void _savePlan() async {
    if (_lessonPlanController.text.isEmpty || _lessonPlanController.text.startsWith('Error:')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No valid lesson plan to save.')),
      );
      return;
    }
    setState(() {
      _isSavingPlan = true;
    });

    // Generate a simple title from the first few words of the transcript or plan
    String planTitle = _transcript.split(' ').take(5).join(' ');
    if (planTitle.isEmpty) planTitle = 'New Lesson Plan';

    final planContent = _lessonPlanController.text;
    final docId = await _lessonPlanService.saveLessonPlan(planTitle, planContent);

    if (mounted) {
      setState(() {
        _isSavingPlan = false;
      });
      if (docId != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lesson plan saved successfully (ID: $docId)!')),
        );
        // Optionally, clear the fields or navigate away
        // _transcript = 'Press the mic and start speaking...';
        // _lessonPlanController.text = '';
        // _lessonPlan = '';
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to save lesson plan.')),
        );
      }
    }
  }

  @override
  void dispose() {
    _lessonPlanController.dispose();
    // _speechService.dispose(); // SpeechToText doesn't have a specific dispose method in the plugin
    // but if we had other resources in the service, we would dispose them here.
    if (_speechService.isListening) { // Ensure to stop listening if screen is disposed
      _speechService.stopListening(onListeningStatusChanged: (_){});
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Speech to Plan'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          children: <Widget>[
            Text(
              'Record Your Lesson Idea:',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16.0),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(_isListening ? Icons.mic_off : Icons.mic),
                  iconSize: 48.0,
                  onPressed: _speechAvailable ? _toggleListening : null, // Disable if speech not available
                  tooltip: _isListening ? 'Stop Listening' : (_speechAvailable ? 'Start Listening' : 'Speech not available'),
                  color: _speechAvailable ? Theme.of(context).colorScheme.primary : Colors.grey,
                ),
              ],
            ),
            const SizedBox(height: 16.0),
            Text(
              'Live Transcript:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8.0),
            Container(
              padding: const EdgeInsets.all(12.0),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Text(_transcript, style: const TextStyle(fontSize: 16.0)),
            ),
            const SizedBox(height: 24.0),
            ElevatedButton.icon(
              icon: _isGeneratingPlan 
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.auto_awesome_outlined),
              label: Text(_isGeneratingPlan ? 'Generating...' : 'Generate Plan'),
              onPressed: _isGeneratingPlan || _transcript.isEmpty || _transcript.startsWith('Press the mic') || _transcript.startsWith('No speech detected') ? null : _generatePlan,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
              ),
            ),
            const SizedBox(height: 24.0),
            Text(
              'Generated Lesson Plan:',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8.0),
            TextField(
              controller: _lessonPlanController,
              maxLines: 10,
              decoration: InputDecoration(
                hintText: 'Lesson plan will appear here...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
            ),
            const SizedBox(height: 24.0),
            ElevatedButton.icon(
              icon: _isSavingPlan
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save_alt_outlined),
              label: Text(_isSavingPlan ? 'Saving...' : 'Save Plan to Firestore'),
              onPressed: _isSavingPlan || _lessonPlanController.text.isEmpty || _lessonPlanController.text.startsWith('Error:') ? null : _savePlan, 
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
