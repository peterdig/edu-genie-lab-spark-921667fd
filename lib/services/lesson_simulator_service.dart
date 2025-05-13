import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb, kDebugMode
import 'dart:io' show Platform; // For Platform.isAndroid, Platform.isIOS
import 'package:http/http.dart' as http;
import 'package:eduprepai/models/simulation_result.dart'; // Ensure this path is correct

class LessonSimulatorService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Helper to determine the correct base URL for the API
  String get _apiBaseUrl {
    // --- IMPORTANT FOR PHYSICAL DEVICE TESTING ---
    // 1. Find your laptop's local network IP address (e.g., 192.168.1.101).
    // 2. Replace "YOUR_LAPTOP_IP" (the placeholder) in the line below with that address if it's still the placeholder.
    //    If you've already set your IP (e.g., "192.168.0.101"), leave it as is.
    // 3. Ensure your phone and laptop are on the SAME Wi-Fi network.
    // 4. Ensure your laptop's firewall allows connections on port 8000.
    const String myLaptopIp = "192.168.0.101"; // <<< ENSURE THIS IS YOUR ACTUAL LAPTOP IP if different
    // --- IMPORTANT FOR PHYSICAL DEVICE TESTING ---

    // This condition checks if you've UPDATED the placeholder. It should compare against the literal string "YOUR_LAPTOP_IP".
    if (kDebugMode && myLaptopIp != "YOUR_LAPTOP_IP" && !kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
        // When testing on a physical device, and you've set your IP from the placeholder
        print("Using custom IP for physical device: http://$myLaptopIp:8000");
        return 'http://$myLaptopIp:8000';
    }

    if (kIsWeb) {
      // For web, 'localhost' or '127.0.0.1' should work directly
      return 'http://localhost:8000';
    } else if (Platform.isAndroid) {
      // Android Emulator uses 10.0.2.2 to map to host's localhost
      return 'http://10.0.2.2:8000';
    } else if (Platform.isIOS) {
      // iOS Simulator can use 'localhost' or '127.0.0.1'
      return 'http://localhost:8000';
    } else {
      // Fallback for other platforms or unexpected scenarios.
      print(
          'Warning: Platform not explicitly handled for API URL. Defaulting to localhost. Consider setting myLaptopIp for physical devices.');
      return 'http://localhost:8000';
    }
  }

  // Construct the full API URL for simulating lessons
  String get _simulateLessonApiUrl => '$_apiBaseUrl/api/v1/simulate-lesson';

  Future<SimulationFeedback?> simulateLesson(SimulationInput input) async {
    User? user = _auth.currentUser;
    if (user == null) {
      debugPrint('User not logged in.');
      // Consider throwing an exception or returning a specific error object
      return null;
    }

    String? token = await user.getIdToken();
    if (token == null) {
      debugPrint('Could not retrieve Firebase auth token.');
      return null;
    }

    // Prepare the request body, including the token as expected by the backend
    Map<String, dynamic> requestBody = input.toJson();
    requestBody['token'] = token; // Add token for authentication

    try {
      debugPrint('Sending simulation request to: $_simulateLessonApiUrl');
      debugPrint('Request body: ${jsonEncode(requestBody)}');

      final response = await http.post(
        Uri.parse(_simulateLessonApiUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(requestBody),
      );

      debugPrint('Simulation API Response Status: ${response.statusCode}');
      debugPrint('Simulation API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // The backend directly returns the feedback part and saves the full StoredSimulationData
        return SimulationFeedback.fromJson(data);
      } else {
        debugPrint('Failed to simulate lesson. Status code: ${response.statusCode}, Body: ${response.body}');
        // Optionally parse and return more specific error info from response.body
        return null;
      }
    } catch (e) {
      debugPrint('Error calling lesson simulation API: $e');
      return null;
    }
  }

  // Method to fetch past simulations for the current user
  Stream<List<StoredSimulationData>> getPastSimulations() {
    User? user = _auth.currentUser;
    if (user == null) {
      return Stream.value([]); // Return an empty stream if user is not logged in
    }

    return _firestore
        .collection('simulations') // Root collection
        .doc(user.uid)             // User-specific document
        .collection('user_simulations') // Subcollection for user's simulations
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        // Ensure you have a valid fromFirestore constructor in StoredSimulationData
        return StoredSimulationData.fromFirestore(doc as DocumentSnapshot<Map<String, dynamic>>);
      }).toList();
    });
  }
}