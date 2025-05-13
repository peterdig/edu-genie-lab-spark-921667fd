import 'package:eduprepai/models/simulation_result.dart';
import 'package:eduprepai/services/lesson_simulator_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For FilteringTextInputFormatter

class LessonSimulatorScreen extends StatefulWidget {
  static const String routeName = '/lesson-simulator';

  const LessonSimulatorScreen({Key? key}) : super(key: key);

  @override
  _LessonSimulatorScreenState createState() => _LessonSimulatorScreenState();
}

class _LessonSimulatorScreenState extends State<LessonSimulatorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _lessonPlanController = TextEditingController();
  final _teacherIdeasController = TextEditingController();
  final _studentAgeController = TextEditingController();
  final _classSizeController = TextEditingController();
  String? _subjectComplexityValue; // For dropdown

  final List<String> _subjectComplexityOptions = ['Beginner', 'Intermediate', 'Advanced', 'Mixed'];

  bool _isLoading = false;
  SimulationFeedback? _simulationFeedback;
  String? _errorMessage;

  final LessonSimulatorService _simulatorService = LessonSimulatorService();

  Future<void> _runSimulation() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
        _simulationFeedback = null;
        _errorMessage = null;
      });

      final input = SimulationInput(
        lessonPlan: _lessonPlanController.text,
        teacherIdeas: _teacherIdeasController.text,
        studentAge: int.parse(_studentAgeController.text),
        classSize: int.parse(_classSizeController.text),
        subjectComplexity: _subjectComplexityValue!,
        // transcript: null, // Not implemented in form yet
      );

      try {
        final feedback = await _simulatorService.simulateLesson(input);
        setState(() {
          _simulationFeedback = feedback;
          if (feedback == null) {
            _errorMessage = 'Failed to get simulation feedback from the server.';
          }
        });
      } catch (e) {
        setState(() {
          _errorMessage = 'An error occurred: ${e.toString()}';
        });
      }
      finally {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _lessonPlanController.dispose();
    _teacherIdeasController.dispose();
    _studentAgeController.dispose();
    _classSizeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lesson Simulator'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text('Simulate Your Lesson', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 20),

              TextFormField(
                controller: _lessonPlanController,
                decoration: const InputDecoration(
                  labelText: 'Lesson Plan Content',
                  hintText: 'Paste or type your full lesson plan here...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 8,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter the lesson plan content.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              TextFormField(
                controller: _teacherIdeasController,
                decoration: const InputDecoration(
                  labelText: 'Teacher\'s Ideas/Additional Comments',
                  hintText: 'Any specific approaches, activities, or points you plan to emphasize...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
                 validator: (value) { // Optional field, but good to have the controller
                  return null;
                },
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _studentAgeController,
                      decoration: const InputDecoration(
                        labelText: 'Avg. Student Age',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Enter age';
                        }
                        if (int.tryParse(value) == null || int.parse(value) <= 0) {
                          return 'Valid age';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _classSizeController,
                      decoration: const InputDecoration(
                        labelText: 'Class Size',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Enter size';
                        }
                        if (int.tryParse(value) == null || int.parse(value) <= 0) {
                          return 'Valid size';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  labelText: 'Subject Complexity',
                  border: OutlineInputBorder(),
                ),
                value: _subjectComplexityValue,
                hint: const Text('Select complexity'),
                onChanged: (String? newValue) {
                  setState(() {
                    _subjectComplexityValue = newValue!;
                  });
                },
                items: _subjectComplexityOptions.map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
                validator: (value) => value == null ? 'Please select complexity' : null,
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _runSimulation,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                ),
                child: _isLoading 
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Simulate Lesson'),
              ),
              const SizedBox(height: 24),

              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),

              if (_simulationFeedback != null)
                _buildFeedbackDisplay(_simulationFeedback!),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeedbackDisplay(SimulationFeedback feedback) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Simulation Results', style: Theme.of(context).textTheme.titleLarge),
            const Divider(height: 20, thickness: 1),
            
            _buildFeedbackSection('Student Reactions:', feedback.studentReactions),
            _buildFeedbackSection('Potential Questions:', feedback.questions),
            _buildFeedbackSection('Suggestions for Improvement:', feedback.suggestions),
            _buildFeedbackSection('Potential Problem Areas:', feedback.problemAreas),
            if (feedback.toneFeedback != null && feedback.toneFeedback!.isNotEmpty)
              _buildFeedbackSection('Tone/Pacing Feedback:', [feedback.toneFeedback!]),
            _buildFeedbackSection('General Improvement Tips:', feedback.improvementTips),
            const SizedBox(height: 8),
            Text('Generated: ${feedback.timestamp.toLocal().toString()}', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedbackSection(String title, List<String> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(left: 8.0, bottom: 4.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [        
                const Text('• ', style: TextStyle(fontSize: 16)),      
                Expanded(child: Text(item)),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }
}