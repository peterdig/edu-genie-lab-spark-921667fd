# EduPrepAI: Your Intelligent Teaching Assistant

EduPrepAI is a comprehensive platform designed to empower teachers and educators by leveraging the power of Artificial Intelligence. Our goal is to streamline lesson planning, quiz generation, and provide interactive learning simulations, ultimately saving educators valuable time and enhancing the learning experience.

## Key Features

- **AI Lesson Planner**: Automatically generate detailed and structured lesson plans based on topics or learning objectives. Utilizes AI to suggest activities, resources, and assessment methods.
- **Quiz Generation**: Create quizzes effortlessly by uploading PDF documents or providing text content. The AI extracts relevant information and formulates questions.
- **Interactive Lesson Simulator**: Simulate lesson scenarios to practice teaching strategies and classroom management in a controlled environment.
- **Speech-to-Plan**: Dictate your lesson ideas, and our AI will convert your speech into a structured lesson plan, ready for review and refinement.
- **User Authentication**: Secure access to features with Firebase Authentication.
- **Cloud Storage**: Store and manage lesson plans, quizzes, and other educational materials using Firebase Firestore and Storage.

## Tech Stack

- **Frontend**: Flutter (Cross-platform mobile, web, and desktop applications)
- **Backend**: Python with FastAPI (High-performance API development)
- **Database & Storage**: Firebase (Firestore, Firebase Storage, Firebase Authentication)
- **AI Integration**: Gemini API (for content generation and analysis features)

## Prerequisites

Before you begin, ensure you have the following installed:
- Flutter SDK (latest stable version recommended)
- Python (3.8+ recommended)
- An active Firebase project.
- Git (for cloning the repository)

## Project Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd eduprepai
    ```

### Backend Setup (FastAPI)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory with your Gemini API Key:
    ```env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

5.  **Firebase Admin SDK Setup:**
    - Download your `serviceAccountKey.json` from your Firebase project settings (Project settings > Service accounts > Generate new private key).
    - Place the `serviceAccountKey.json` file into the `backend` directory.

### Frontend Setup (Flutter)

1.  **Navigate to the Flutter project root (if not already there):**
    ```bash
    # Assuming you are in the 'backend' directory from the previous step
    cd ..
    # Or if you are in the project root: cd eduprepai
    ```

2.  **Configure Firebase for your Flutter app:**
    - Follow the instructions on the [FlutterFire overview](https://firebase.flutter.dev/docs/overview#installation) to add Firebase to your Flutter app.
    - This typically involves using the FlutterFire CLI:
      ```bash
      flutterfire configure
      ```
    - Ensure the generated `lib/firebase_options.dart` is correctly configured and added to your project.

3.  **Install Flutter dependencies:**
    ```bash
    flutter pub get
    ```

## How to Run the Application

### 1. Start the Backend Server

- Navigate to the `backend` directory.
- Ensure your Python virtual environment is activated.
- Run the FastAPI server:
  ```bash
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```
  (Using `--host 0.0.0.0` makes the server accessible on your local network).

### 2. Run the Flutter Application

- Navigate to the Flutter project root (`eduprepai`).
- Select your target device (Emulator, Simulator, Physical Device, or Web).
- Run the app:
  ```bash
  flutter run
  ```

#### **Important for Physical Device Testing:**

If you are running the Flutter app on a physical Android/iOS device and the backend is running on your laptop, you need to ensure the app can reach your laptop's IP address.

1.  Find your laptop's local IP address (e.g., `192.168.1.X`).
2.  In the Flutter app, specifically in files like `lib/services/lesson_simulator_service.dart` and `lib/screens/quiz_generator/quiz_generator_screen.dart`, update the `myLaptopIp` constant:
    ```dart
    // Example from lesson_simulator_service.dart
    // const String myLaptopIp = "YOUR_LAPTOP_IP"; // Before
    const String myLaptopIp = "192.168.1.X"; // After (replace with your actual IP)
    ```
3.  Ensure your laptop's firewall allows incoming connections on port 8000 (or the port your backend is running on).
4.  Both your physical device and laptop must be on the **same Wi-Fi network**.

## Firebase Usage Notes

- **Authentication**: Email/Password sign-in is used. Ensure this is enabled in your Firebase project.
- **Firestore Database**: Used for storing lesson plans, quiz metadata, etc.
- **Firebase Storage**: Used for storing uploaded files (e.g., PDFs for quiz generation).

---

*This README provides a guide to setting up and running EduPrepAI. For specific feature development or contributions, please refer to the relevant source code and comments.*
