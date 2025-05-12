# EduPrep AI

AI-powered teaching assistant platform for teachers and educators.

## Features

- **AI Lesson Planner**: Generate detailed lesson plans using AI

## Setup

### Backend (FastAPI)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Run the server:
   ```
   uvicorn main:app --reload
   ```

### Frontend (Flutter)

1. Ensure you have Flutter installed

2. Install dependencies:
   ```
   flutter pub get
   ```

3. Run the app:
   ```
   flutter run
   ```

## Firebase Setup

1. Create a Firebase project
2. Enable Firestore database
3. Enable Authentication (email/password)
4. Download and place your `serviceAccountKey.json` in the backend directory
5. Configure Firebase for your Flutter app
