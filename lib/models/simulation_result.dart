// Dart models for Lesson Simulation feature

import 'package:cloud_firestore/cloud_firestore.dart';

class SimulationInput {
  final String lessonPlan;
  final String teacherIdeas; 
  final int studentAge;
  final int classSize;
  final String subjectComplexity; // e.g., "beginner", "intermediate", "advanced"
  final String? transcript; // Optional: from speech
  final String? userId; // To associate with the user in Firestore

  SimulationInput({
    required this.lessonPlan,
    required this.teacherIdeas,
    required this.studentAge,
    required this.classSize,
    required this.subjectComplexity,
    this.transcript,
    this.userId,
  });

  Map<String, dynamic> toJson() => {
        'lesson_plan': lessonPlan,
        'teacher_ideas': teacherIdeas,
        'student_age': studentAge,
        'class_size': classSize,
        'subject_complexity': subjectComplexity,
        if (transcript != null) 'transcript': transcript,
        if (userId != null) 'user_id': userId, // for backend use if needed directly
      };
}

class SimulationFeedback {
  final List<String> studentReactions;
  final List<String> questions;
  final List<String> suggestions;
  final List<String> problemAreas;
  final String? toneFeedback;
  final List<String> improvementTips;
  final DateTime timestamp;

  SimulationFeedback({
    required this.studentReactions,
    required this.questions,
    required this.suggestions,
    required this.problemAreas,
    this.toneFeedback,
    required this.improvementTips,
    required this.timestamp,
  });

  factory SimulationFeedback.fromJson(Map<String, dynamic> json) {
    return SimulationFeedback(
      studentReactions: List<String>.from(json['student_reactions'] ?? []),
      questions: List<String>.from(json['questions'] ?? []),
      suggestions: List<String>.from(json['suggestions'] ?? []),
      problemAreas: List<String>.from(json['problem_areas'] ?? []),
      toneFeedback: json['tone_feedback'] as String?,
      improvementTips: List<String>.from(json['improvement_tips'] ?? []),
      timestamp: json['timestamp'] != null
          ? (json['timestamp'] is Timestamp // Handle Firestore Timestamp
              ? (json['timestamp'] as Timestamp).toDate()
              : DateTime.parse(json['timestamp'] as String))
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'student_reactions': studentReactions,
        'questions': questions,
        'suggestions': suggestions,
        'problem_areas': problemAreas,
        'tone_feedback': toneFeedback,
        'improvement_tips': improvementTips,
        'timestamp': Timestamp.fromDate(timestamp), // Store as Firestore Timestamp
      };
}

// Represents the full data structure stored in Firestore and potentially returned by API
class StoredSimulationData {
  final String id; // Firestore document ID
  final SimulationInput inputData;
  final SimulationFeedback feedback;
  final String userId;

  StoredSimulationData({
    required this.id,
    required this.inputData,
    required this.feedback,
    required this.userId,
  });

 factory StoredSimulationData.fromFirestore(DocumentSnapshot<Map<String, dynamic>> snapshot) {
    final data = snapshot.data()!;
    return StoredSimulationData(
      id: snapshot.id,
      inputData: SimulationInput(
        lessonPlan: data['input_data']['lesson_plan'] ?? '',
        teacherIdeas: data['input_data']['teacher_ideas'] ?? '',
        studentAge: data['input_data']['student_age'] ?? 0,
        classSize: data['input_data']['class_size'] ?? 0,
        subjectComplexity: data['input_data']['subject_complexity'] ?? 'unknown',
        transcript: data['input_data']['transcript'] as String?,
        userId: data['userId'] ?? '',
      ),
      feedback: SimulationFeedback.fromJson(data['feedback'] as Map<String, dynamic>),
      userId: data['userId'] ?? '',
    );
  }
 Map<String, dynamic> toFirestore() {
    return {
      'input_data': inputData.toJson(),
      'feedback': feedback.toJson(),
      'userId': userId,
      'timestamp': feedback.timestamp, // Redundant but can be useful for querying top-level
    };
  }
}
