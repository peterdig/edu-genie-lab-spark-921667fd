// Service for lesson plan generation and Firestore interaction
import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kDebugMode, kIsWeb;
import 'dart:io' show Platform;

// <<< IMPORTANT: SET YOUR LAPTOP'S IP HERE FOR PHYSICAL DEVICE TESTING >>>
const String myLaptopIp = "192.168.0.101"; // <<<<<<< SET YOUR LAPTOP'S IP ADDRESS HERE FOR PHYSICAL DEVICE TESTING

class LessonPlanService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String get _apiBaseUrl {
    // Physical Android/iOS device in debug mode with a configured IP
    if (kDebugMode && myLaptopIp != "YOUR_LAPTOP_IP" && !kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      return 'http://$myLaptopIp:8000';
    }
    // Android Emulator
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8000';
    }
    // Default for web, iOS simulator, or other cases (e.g., release mode on physical device if IP not set for some reason)
    return 'http://localhost:8000';
  }

  String get _dynamicSpeechToPlanApiUrl => '$_apiBaseUrl/api/v1/speech-to-plan';

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

    // Safety check for physical device configuration
    if (kDebugMode && myLaptopIp == "YOUR_LAPTOP_IP" && !kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
        if (kDebugMode) {
            print('API endpoint not configured correctly for physical device. Please set `myLaptopIp` in lesson_plan_service.dart.');
        }
        return 'Error: Backend API endpoint not configured for physical device. Please set your laptop\'s IP address in the app code.';
    }

    try {
      final response = await http.post(
        Uri.parse(_dynamicSpeechToPlanApiUrl),
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
