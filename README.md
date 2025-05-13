# EduGenie - AI-Powered Educational Content Generator

EduGenie is a powerful educational content generation platform that helps teachers create lesson plans, assessments, and other educational materials using AI models from OpenRouter.

## Features

- Generate detailed lesson plans for any topic and grade level
- Create assessments with customizable question types
- Simulate virtual labs for science education
- Get teaching tips and ideas
- Select from a wide range of free AI models

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, FastAPI
- **AI**: OpenRouter API with free models

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.8+ and pip
- OpenRouter API key (provided in .env files)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd edu-genie
```

2. **Install frontend dependencies**

```bash
npm install
# or
yarn install
```

3. **Install backend dependencies**

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Configuration

The project includes `.env` files with the OpenRouter API key. In a production environment, you should manage these secrets securely.

### Starting the Application

1. **Start the backend server**

```bash
cd backend
python run.py
```

This will start the FastAPI server at http://localhost:8000

2. **Start the frontend development server**

In a new terminal:

```bash
npm run dev
# or
yarn dev
```

This will start the frontend at http://localhost:5173

## Usage

1. Navigate to http://localhost:5173 in your browser
2. Use the "Lessons" tab to create new lesson plans
3. Fill in the lesson details and select an AI model
4. Click "Generate Lesson Plan" to create content

## Available Models

The application connects to OpenRouter's best free models for educational content generation:

- **Meta: Llama 4 Scout** - Massive 512,000 token context length
- **Google: Gemini 2.5 Pro Experimental** - Google's advanced model with 1M token context length
- **DeepSeek: DeepSeek V3** - Excellent for detailed educational content
- **NVIDIA: Llama 3.1 Nemotron Ultra 253B** - NVIDIA's 253B parameter model
- **Mistral: Mistral Small 3.1 24B** - High-quality instruction model

These models were selected for their large context windows and high-quality output capabilities, making them ideal for educational content generation.

## API Documentation

The backend provides a FastAPI interface with automatic Swagger documentation at:
http://localhost:8000/docs

## License

This project is licensed under the MIT License.

## Troubleshooting

### Backend Issues
If you encounter path issues when trying to run the backend:

1. Make sure you're in the correct directory:
   ```
   cd D:\EdGenie\edu-genie-lab-spark-921667fd
   ```

2. Run the backend using the batch file:
   ```
   run_backend.bat
   ```

3. Or run it directly from the correct location:
   ```
   cd backend
   python run.py
   ```

### Frontend Issues
If you encounter port conflicts with the frontend:

1. The Vite server is now configured to use port 8081 automatically

2. You can start the frontend with:
   ```
   npm run dev
   ```

3. Access the application at: http://localhost:8081/

## Handling OpenRouter Rate Limits

The application uses OpenRouter API for AI content generation, which has rate limits on free tiers.

### Rate Limit Error Handling

When rate limits are reached:

1. **Teaching Tips**: The application will automatically return fallback content specific to the subject area.
2. **Lesson Plans/Assessments**: The API will return a clear error message with the 429 status code.

### Monitoring and Diagnostics

Run the test script to check rate limit status:
```
cd backend
python test_openrouter.py
```

If you see a rate limit error, the script will display:
- Current rate limit information
- When the limit will reset
- Options for resolving the issue

### Solutions

If you encounter rate limits:

1. **Wait for Reset**: Rate limits typically reset daily
2. **Add Credits**: Purchase credits on OpenRouter for higher limits
3. **Use Fallback Content**: The application includes fallback content for critical features

## Port Configuration

The backend server runs on port 8888 by default. If you need to change this:

1. Edit `run_backend.bat` or `run_backend.sh` to use a different port
2. Update the `--port` parameter in `backend/run.py`
3. Update API URL references in the frontend code if needed

## Contact & Support

For issues, questions, or contributions, please contact:
- Email: support@edu-genie-app.com
- GitHub: [Create an issue](https://github.com/your-repo/issues)

## Database Setup

This application uses Supabase for data storage. Follow these steps to set up the database:

1. Make sure you have a Supabase account and have created a project.
2. Copy the Supabase URL and anon key from your Supabase project dashboard.
3. Create a `.env` file in the root directory and add the following:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the following command to set up all required database tables:

```bash
npm run db:setup
```

This will create the following tables in your Supabase database:
- `profiles`: User profiles and authentication data
- `auth_events`: Tracking of authentication events
- `collaborative_documents`: Documents for collaborative editing
- `document_history`: Version history for documents
- `document_collaborators`: User permissions for documents
- `document_messages`: Chat messages for documents

## Collaborative Documents

The application supports real-time collaborative document editing with the following features:

1. **Document Creation**: Create new documents with different types (lessons, assessments, rubrics)
2. **Real-time Editing**: Multiple users can edit documents simultaneously
3. **Version History**: All changes are tracked with version history
4. **Chat**: In-document chat for collaboration
5. **User Presence**: See who is currently viewing/editing the document

### Offline Support

The application provides offline support with:
- Local storage fallback for data when database is unavailable
- Automatic sync when connectivity is restored
- Cache for frequent operations

## Running the Application

To start the development server:

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

## Troubleshooting Database Issues

If you encounter database issues:

1. Check that your Supabase URL and key are correct in the `.env` file
2. Ensure the database tables are created properly by running:
   ```bash
   npm run db:setup
   ```
3. Check the browser console for specific error messages
4. Verify that your Supabase project has Row Level Security (RLS) policies configured correctly
5. If data isn't being saved, the application will fall back to using localStorage
