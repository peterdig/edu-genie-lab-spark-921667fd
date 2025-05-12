import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
// Import auth_screen.dart later for logout navigation
// import 'auth_screen.dart'; 

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              // Navigation to AuthScreen will be handled by the stream in main.dart
            },
          ),
        ],
      ),
      body: const Center(
        child: Text('Welcome to your Dashboard!'),
        // TODO: Implement UI showing subjects/grades
      ),
    );
  }
} 