# EdGenie Backend

The backend for EdGenie uses FastAPI to provide AI-powered educational content generation via OpenRouter API.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up your environment variables:
   - Create a `.env` file in this directory 
   - Add your OpenRouter API key:
     ```
     OPENROUTER_API_KEY=your_api_key_here
     DEBUG=False
     ```

## Running the Backend

From the backend directory:
```
python run.py
```

Or from the project root:
```
run_backend.bat
```

The server will be available at http://localhost:8000

## API Endpoints

- `/models` - Get available AI models
- `/models/recommended` - Get recommended models for education
- `/generate/lesson` - Generate a lesson plan
- `/generate/assessment` - Generate an assessment
- `/generate/lab` - Generate a virtual lab
- `/generate/teaching-tip` - Generate a teaching tip

## Models

The backend uses the following free AI models from OpenRouter:
- Meta Llama 3.1 8B Instruct (Recommended)
- Mistral 7B Instruct
- DeepSeek V3 Base
- Qwen3 4B
- Google Gemma 3 12B

## Troubleshooting

- **OpenRouter API Key**: Make sure you have a valid API key from [OpenRouter](https://openrouter.ai)
- **Rate Limits**: If you encounter rate limit errors, the system will attempt to use alternative models
- **Module Errors**: Make sure you've installed all requirements and are running Python 3.8+
- **Path Issues**: The application uses script_dir to ensure it runs from any directory 