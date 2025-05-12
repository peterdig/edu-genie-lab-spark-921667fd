import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart'; // Import Firestore
// Import dashboard_screen.dart and any other necessary files later
// import 'dashboard_screen.dart'; 

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLogin = true;
  String _email = '';
  String _password = '';
  bool _isLoading = false;

  // Instance of FirebaseAuth
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance; // Instance of Firestore

  Future<void> _storeUserData(User user, String email) async {
    try {
      await _firestore.collection('users').doc(user.uid).set({
        'email': email,
        'createdAt': Timestamp.now(),
        // Add other user profile data and preferences later
        // 'subjects': [],
        // 'grades': [], 
      });
    } catch (e) {
      // Handle Firestore errors, e.g., show a message
      print('Firestore error while storing user data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Could not save user data. Please try again later.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _trySubmit() async {
    final isValid = _formKey.currentState?.validate();
    FocusScope.of(context).unfocus(); // Close keyboard

    if (isValid == true) {
      _formKey.currentState?.save();
      setState(() {
        _isLoading = true;
      });

      try {
        UserCredential userCredential;
        if (_isLogin) {
          // Log in user
          userCredential = await _auth.signInWithEmailAndPassword(
            email: _email.trim(),
            password: _password.trim(),
          );
          // Navigate to Dashboard or handle login success
          // For now, just print a message
          print('Logged in: \${userCredential.user?.uid}');
          // If successful, the authStateChanges stream in main.dart will handle navigation
        } else {
          // Register user
          userCredential = await _auth.createUserWithEmailAndPassword(
            email: _email.trim(),
            password: _password.trim(),
          );
          print('Registered: \${userCredential.user?.uid}');
          if (userCredential.user != null) {
            await _storeUserData(userCredential.user!, _email.trim());
          }
          // TODO: Store user profile data in Firestore here
          // If successful, the authStateChanges stream in main.dart will handle navigation
        }
      } on FirebaseAuthException catch (e) {
        String message = 'An error occurred!';
        if (e.code == 'weak-password') {
          message = 'The password provided is too weak.';
        } else if (e.code == 'email-already-in-use') {
          message = 'The account already exists for that email.';
        } else if (e.code == 'user-not-found' || e.code == 'wrong-password' || e.code == 'invalid-credential') {
          message = 'Invalid email or password.';
        } else if (e.message != null && e.message!.isNotEmpty) {
          message = e.message!;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      } catch (e) {
        print(e);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('An unexpected error occurred. Please try again.'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final deviceSize = MediaQuery.of(context).size;
    return Scaffold(
      body: Container(
        height: deviceSize.height,
        width: deviceSize.width,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primary.withOpacity(0.5),
              Theme.of(context).colorScheme.secondary.withOpacity(0.9),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            stops: const [0, 1],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                // App Logo/Name Placeholder
                Container(
                  margin: const EdgeInsets.only(bottom: 40.0),
                  child: Text(
                    'EduPrep AI',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimary,
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),
                Card(
                  elevation: 8.0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15.0),
                  ),
                  margin: const EdgeInsets.symmetric(horizontal: 30.0),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Text(
                            _isLogin ? 'Welcome Back!' : 'Create Account',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            key: const ValueKey('email'),
                            validator: (value) {
                              if (value == null || !value.contains('@') || value.trim().isEmpty) {
                                return 'Please enter a valid email address.';
                              }
                              return null;
                            },
                            onSaved: (value) {
                              _email = value?.trim() ?? '';
                            },
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            decoration: InputDecoration(
                              labelText: 'Email Address',
                              prefixIcon: Icon(Icons.email_outlined, color: Theme.of(context).colorScheme.primary),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),
                          TextFormField(
                            key: const ValueKey('password'),
                            validator: (value) {
                              if (value == null || value.trim().length < 7) {
                                return 'Password must be at least 7 characters long.';
                              }
                              return null;
                            },
                            onSaved: (value) {
                              _password = value?.trim() ?? '';
                            },
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText: 'Password',
                              prefixIcon: Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.primary),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10.0),
                              ),
                            ),
                          ),
                          const SizedBox(height: 25),
                          if (_isLoading)
                            const CircularProgressIndicator()
                          else
                            ElevatedButton(
                              onPressed: _trySubmit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Theme.of(context).colorScheme.primary,
                                foregroundColor: Theme.of(context).colorScheme.onPrimary,
                                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10.0),
                                ),
                              ),
                              child: Text(_isLogin ? 'LOGIN' : 'SIGN UP'),
                            ),
                          const SizedBox(height: 10),
                          if (!_isLoading)
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isLogin = !_isLogin;
                                });
                              },
                              style: TextButton.styleFrom(
                                foregroundColor: Theme.of(context).colorScheme.secondary,
                              ),
                              child: Text(
                                _isLogin
                                    ? 'Create new account'
                                    : 'I already have an account',
                                style: const TextStyle(fontSize: 16),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 