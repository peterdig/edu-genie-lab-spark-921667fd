// Service for lesson plan generation and Firestore interaction
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kDebugMode;

class LessonPlanService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  // For Android Emulator, backend is typically at 10.0.2.2. For iOS Sim/Physical Device, use your computer's local IP.
  final String _speechToPlanApiUrl = 'http://localhost:8000/api/v1/speech-to-plan'; 

  Future<String?> generateLessonPlan(String transcript) async {
    User? user = _auth.currentUser;
    if (user == null) {
      if (kDebugMode) {
        print('User not logged in.');
      }
      return 'Error: User not logged in. Please log in to generate a plan.';
    }

    String? token = await user.getIdToken();
    if (token == null) {
      if (kDebugMode) {
        print('Could not retrieve Firebase auth token.');
      }
      return 'Error: Could not authenticate user. Please try logging in again.';
    }

    if (_speechToPlanApiUrl == 'YOUR_BACKEND_API_ENDPOINT_HERE') { // This check is now less relevant but kept for safety
        if (kDebugMode) {
            print('API endpoint not configured correctly.');
        }
        // Fallback to simulated if somehow the URL is still the placeholder
        await Future.delayed(const Duration(seconds: 2));
        return 'Simulated Lesson Plan based on: "$transcript"\n- Objective 1\n- Activity 1\n- Assessment 1';
    }

    try {
      final response = await http.post(
        Uri.parse(_speechToPlanApiUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'transcript': transcript, 'token': token}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['plan'] as String? ?? 'Error: Could not parse lesson plan from API response.';
      } else {
        if (kDebugMode) {
          print('Failed to generate lesson plan. Status code: ${response.statusCode}');
          print('Response body: ${response.body}');
        }
        String errorMessage = 'Error: Failed to generate lesson plan (Code: ${response.statusCode}).';
        try {
            final errorData = jsonDecode(response.body);
            if (errorData['detail'] != null) {
                errorMessage += ' Details: ${errorData['detail']}';
            }
        } catch (_) {
            // If parsing error detail fails, use the original message
        }
        return errorMessage;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error calling lesson plan API: $e');
      }
      return 'Error: An exception occurred while generating the plan: $e';
    }
  }

  Future<String?> saveLessonPlan(String planTitle, String planContent) async {
    User? user = _auth.currentUser;
    if (user == null) {
      if (kDebugMode) {
        print('User not logged in. Cannot save plan.');
      }
      return null; // Or throw an exception/return an error message
    }

    try {
      DocumentReference docRef = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('lessonPlans')
          .add({
        'title': planTitle, // Consider getting a title or generating one
        'content': planContent,
        'createdAt': Timestamp.now(),
        'updatedAt': Timestamp.now(),
      });
      if (kDebugMode) {
        print('Lesson plan saved with ID: ${docRef.id}');
      }
      return docRef.id; // Return the ID of the saved document
    } catch (e) {
      if (kDebugMode) {
        print('Error saving lesson plan to Firestore: $e');
      }
      return null; // Or throw an exception/return an error message
    }
  }
  
  // Optional: Method to retrieve lesson plans (example)
  Stream<QuerySnapshot> getLessonPlansStream() {
    User? user = _auth.currentUser;
    if (user == null) {
      return Stream.empty(); // Or handle appropriately
    }
    return _firestore
        .collection('users')
        .doc(user.uid)
        .collection('lessonPlans')
        .orderBy('createdAt', descending: true)
        .snapshots();
  }
}
