# Deploying EduGenie Backend to Render

This guide explains how to deploy the EduGenie backend to Render.

## Prerequisites

1. A [Render](https://render.com/) account
2. Your OpenRouter API key

## Deployment Steps

### Option 1: Manual Deployment

1. **Create a new Web Service on Render**
   - Log in to your Render account
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing the EduGenie backend

2. **Configure the Web Service**
   - **Name**: Choose a name for your service (e.g., "edugenie-api")
   - **Environment**: Select "Python"
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.api:app`
   - **Root Directory**: `backend` (if your backend code is in a subfolder)

3. **Set Environment Variables**
   - Click "Environment" tab
   - Add the following variables:
     - `OPENROUTER_API_KEY`: Your OpenRouter API key
     - `DEBUG`: Set to `False` for production

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

### Option 2: Using render.yaml

1. **Push the render.yaml file**
   - Ensure the `render.yaml` file is in your repository
   - Push to GitHub

2. **Create a new Blueprint on Render**
   - Log in to your Render account
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file and configure your services

3. **Set Secret Environment Variables**
   - After creating the services, navigate to your web service
   - Click "Environment" tab
   - Add the `OPENROUTER_API_KEY` value (it should be marked as a secret in render.yaml)

## Updating Your Application

1. Push changes to your GitHub repository
2. Render will automatically detect changes and redeploy

## Important Notes

- Make sure `.env` files are in `.gitignore` to avoid exposing secrets
- The production environment should have `DEBUG=False`
- The backend requires the OpenRouter API key to function properly
- For improved security, set up proper CORS configurations in production

## Checking the Deployment

After deployment, your API will be available at:
`https://your-service-name.onrender.com`

You can test it by accessing the documentation endpoint:
`https://your-service-name.onrender.com/docs` 