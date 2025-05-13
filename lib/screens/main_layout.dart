import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'home/home_screen.dart';
import 'lesson_planning/lesson_planning_screen.dart';
import 'quiz_generator/quiz_generator_screen.dart';
import 'virtual_labs/virtual_labs_screen.dart';
import 'resource_summarizer/resource_summarizer_screen.dart';
import 'lesson_planning/speech_to_plan_screen.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // List of screens for bottom navigation
  final List<Widget> _screens = [
    const HomeScreen(),
    const LessonPlanningScreen(),
    const ResourceSummarizerScreen(),
    const QuizGeneratorScreen(),
    const VirtualLabsScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final theme = Theme.of(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: Text(
          _getScreenTitle(),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications')),
              );
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Colors.white,
                    child: Text(
                      user?.email?.substring(0, 1).toUpperCase() ?? 'U',
                      style: TextStyle(
                        fontSize: 24,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    user?.email ?? 'User',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                  const Text(
                    'Teacher',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            _buildDrawerItem(
              Icons.dashboard_outlined,
              'Dashboard',
              0,
              theme,
            ),
            _buildDrawerItem(
              Icons.book_outlined,
              'AI Lesson Planner',
              1,
              theme,
            ),
            _buildDrawerItem(
              Icons.summarize_outlined,
              'Resource Summarizer',
              2,
              theme,
            ),
            _buildDrawerItem(
              Icons.quiz_outlined,
              'Quiz & Worksheet Generator',
              3,
              theme,
            ),
            _buildDrawerItem(
              Icons.mic_outlined,
              'Speech-to-Plan',
              -1,
              theme,
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SpeechToPlanScreen()),
                );
              },
            ),
            _buildDrawerItem(
              Icons.science_outlined,
              'Virtual Labs',
              4,
              theme,
            ),
            _buildDrawerItem(
              Icons.folder_outlined,
              'My Organizer',
              -1,
              theme,
              onTap: () => _showFeatureNotAvailable('My Organizer'),
            ),
            _buildDrawerItem(
              Icons.share_outlined,
              'Export/Share',
              -1,
              theme,
              onTap: () => _showFeatureNotAvailable('Export/Share'),
            ),
            _buildDrawerItem(
              Icons.offline_bolt_outlined,
              'Offline Mode (Gemma)',
              -1,
              theme,
              onTap: () => _showFeatureNotAvailable('Offline Mode'),
            ),
            const Divider(),
            _buildDrawerItem(
              Icons.settings_outlined,
              'Settings',
              -1,
              theme,
              onTap: () => _showFeatureNotAvailable('Settings'),
            ),
            _buildDrawerItem(
              Icons.help_outline,
              'Help & Feedback',
              -1,
              theme,
              onTap: () => _showFeatureNotAvailable('Help & Feedback'),
            ),
            _buildDrawerItem(
              Icons.logout,
              'Logout',
              -1,
              theme,
              onTap: _handleLogout,
            ),
          ],
        ),
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex < 5 ? _selectedIndex : 0,
        onDestinationSelected: _onItemTapped,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.book_outlined),
            selectedIcon: Icon(Icons.book),
            label: 'Plan',
          ),
          NavigationDestination(
            icon: Icon(Icons.summarize_outlined),
            selectedIcon: Icon(Icons.summarize),
            label: 'Summarize',
          ),
          NavigationDestination(
            icon: Icon(Icons.quiz_outlined),
            selectedIcon: Icon(Icons.quiz),
            label: 'Quiz',
          ),
          NavigationDestination(
            icon: Icon(Icons.science_outlined),
            selectedIcon: Icon(Icons.science),
            label: 'Labs',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Show a bottom sheet with quick create options
          showModalBottomSheet(
            context: context,
            builder: (context) => _buildQuickCreateSheet(),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  String _getScreenTitle() {
    switch (_selectedIndex) {
      case 0:
        return 'EduPrep AI';
      case 1:
        return 'AI Lesson Planner';
      case 2:
        return 'Resource Summarizer';
      case 3:
        return 'Quiz Generator';
      case 4:
        return 'Virtual Labs';
      default:
        return 'EduPrep AI';
    }
  }

  Widget _buildDrawerItem(
    IconData icon,
    String title,
    int index,
    ThemeData theme, {
    VoidCallback? onTap,
  }) {
    final isSelected = index == _selectedIndex && index != -1;
    
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? theme.colorScheme.primary : null,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? theme.colorScheme.primary : null,
          fontWeight: isSelected ? FontWeight.bold : null,
        ),
      ),
      onTap: onTap ?? () {
        if (index != -1) {
          setState(() {
            _selectedIndex = index;
          });
          Navigator.pop(context);
        }
      },
    );
  }

  Widget _buildQuickCreateSheet() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20.0, horizontal: 16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Create New',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildQuickCreateButton(
                Icons.book_outlined,
                'Lesson Plan',
                () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedIndex = 1;
                  });
                },
              ),
              _buildQuickCreateButton(
                Icons.summarize_outlined,
                'Summary',
                () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedIndex = 2;
                  });
                },
              ),
              _buildQuickCreateButton(
                Icons.quiz_outlined,
                'Quiz',
                () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedIndex = 3;
                  });
                },
              ),
              _buildQuickCreateButton(
                Icons.science_outlined,
                'Lab',
                () {
                  Navigator.pop(context);
                  setState(() {
                    _selectedIndex = 4;
                  });
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickCreateButton(
    IconData icon,
    String label,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 80,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  void _showFeatureNotAvailable(String feature) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$feature coming soon!')),
    );
  }

  Future<void> _handleLogout() async {
    await _auth.signOut();
    Navigator.pop(context);
  }
} 