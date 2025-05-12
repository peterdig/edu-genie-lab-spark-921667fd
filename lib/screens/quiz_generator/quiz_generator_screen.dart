import 'package:flutter/material.dart';

class QuizGeneratorScreen extends StatelessWidget {
  const QuizGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.quiz_outlined, 
            size: 64, 
            color: Theme.of(context).colorScheme.primary
          ),
          const SizedBox(height: 16),
          const Text(
            'Quiz Generator',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text('Coming soon'),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Quiz generator is coming soon!')),
              );
            },
            child: const Text('Generate Quiz'),
          ),
        ],
      ),
    );
  }
} 