import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class LessonPlanningScreen extends StatefulWidget {
  const LessonPlanningScreen({super.key});

  @override
  State<LessonPlanningScreen> createState() => _LessonPlanningScreenState();
}

class _LessonPlanningScreenState extends State<LessonPlanningScreen> {
  final _formKey = GlobalKey<FormState>();
  final _syllabusController = TextEditingController();
  final _gradeController = TextEditingController();
  final _subjectController = TextEditingController();
  bool _isGenerating = false;
  String? _generatedPlan;
  final _firestore = FirebaseFirestore.instance;
  final _auth = FirebaseAuth.instance;

  // Get the appropriate backend URL based on platform
  String get _backendUrl {
    if (kIsWeb) {
      // For web deployment, use a deployed URL or localhost if testing
      return 'http://localhost:8000/api/generate-lesson-plan';
    } else {
      // For desktop/mobile
      return 'http://localhost:8000/api/generate-lesson-plan';
    }
  }

  Future<void> _generateLessonPlan() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isGenerating = true;
      _generatedPlan = null;
    });

    try {
      // Get Firebase token
      final token = await _auth.currentUser?.getIdToken();
      if (token == null) {
        throw Exception('User not authenticated');
      }

      // Call FastAPI backend
      final response = await http.post(
        Uri.parse(_backendUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'syllabus': _syllabusController.text,
          'grade': _gradeController.text,
          'subject': _subjectController.text,
          'token': token,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to generate lesson plan: ${response.body}');
      }

      final data = jsonDecode(response.body);
      setState(() {
        _generatedPlan = data['plan'];
        _isGenerating = false;
      });
    } catch (e) {
      setState(() => _isGenerating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error generating lesson plan: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Lesson Planner'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _subjectController,
                        decoration: const InputDecoration(
                          labelText: 'Subject',
                          hintText: 'e.g., Mathematics, Science',
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a subject';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _gradeController,
                        decoration: const InputDecoration(
                          labelText: 'Grade Level',
                          hintText: 'e.g., Grade 5, Class 8',
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter a grade level';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _syllabusController,
                        decoration: const InputDecoration(
                          labelText: 'Syllabus/Topic',
                          hintText: 'Enter the syllabus or topic for the lesson plan',
                        ),
                        maxLines: 5,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter the syllabus or topic';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _isGenerating ? null : _generateLessonPlan,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isGenerating
                            ? const CircularProgressIndicator()
                            : const Text('Generate Lesson Plan'),
                      ),
                    ],
                  ),
                ),
              ),
              if (_generatedPlan != null) ...[
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Generated Lesson Plan',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Use MarkdownBody to render markdown content
                        MarkdownBody(
                          data: _generatedPlan!,
                          selectable: true,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton.icon(
                              icon: const Icon(Icons.save),
                              label: const Text('Save Lesson Plan'),
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Lesson plan saved successfully')),
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              // History of generated lesson plans
              Text(
                'Previously Generated Lesson Plans',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              StreamBuilder<QuerySnapshot>(
                stream: _auth.currentUser != null
                    ? _firestore
                        .collection('users')
                        .doc(_auth.currentUser!.uid)
                        .collection('lessonPlans')
                        .orderBy('createdAt', descending: true)
                        .limit(5)
                        .snapshots()
                    : Stream.empty(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  if (snapshot.hasError) {
                    return Center(child: Text('Error: ${snapshot.error}'));
                  }
                  
                  final plans = snapshot.data?.docs ?? [];
                  
                  if (plans.isEmpty) {
                    return const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No lesson plans created yet.'),
                      ),
                    );
                  }
                  
                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: plans.length,
                    itemBuilder: (context, index) {
                      final plan = plans[index].data() as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text('${plan['subject']} - ${plan['grade']}'),
                          subtitle: Text(plan['syllabus']),
                          trailing: const Icon(Icons.arrow_forward_ios),
                          onTap: () {
                            setState(() {
                              _generatedPlan = plan['plan'];
                            });
                          },
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _syllabusController.dispose();
    _gradeController.dispose();
    _subjectController.dispose();
    super.dispose();
  }
} 