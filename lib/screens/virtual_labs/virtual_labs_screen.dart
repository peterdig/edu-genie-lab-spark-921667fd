import 'package:flutter/material.dart';

class VirtualLabsScreen extends StatelessWidget {
  const VirtualLabsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.science_outlined, 
            size: 64, 
            color: Theme.of(context).colorScheme.primary
          ),
          const SizedBox(height: 16),
          const Text(
            'Virtual Labs',
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
                const SnackBar(content: Text('Virtual labs are coming soon!')),
              );
            },
            child: const Text('Create Lab'),
          ),
        ],
      ),
    );
  }
} 