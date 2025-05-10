import os
import sys
import subprocess
import time
import argparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Run the EduGenie backend server")
    parser.add_argument("--test", action="store_true", help="Run in test mode")
    parser.add_argument("--port", type=int, default=8000, help="Port to run the server on (default: 8000)")
    args = parser.parse_args()
    
    debug = os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes")
    port = args.port
    
    # Check if test flag is provided
    run_tests = args.test or "--test" in sys.argv
    
    print(f"Starting server on port {port}...")
    
    if run_tests:
        print("Starting server with test mode...")
        print("Tests will run after server starts.")
        
        # Start the server as a separate process
        server_cmd = [sys.executable, "-m", "uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", str(port)]
        
        # Start the server process
        server_process = subprocess.Popen(
            server_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        print(f"Server started with PID {server_process.pid}")
        print("Waiting for server to start (5 seconds)...")
        
        # Wait for server to start
        time.sleep(5)
        
        # Check if server is still running
        if server_process.poll() is not None:
            print("Error: Server process terminated unexpectedly")
            stdout, stderr = server_process.communicate()
            print("Server output:", stdout)
            print("Server errors:", stderr)
            sys.exit(1)
            
        # Run the tests
        print("\nRunning API tests...")
        test_process = subprocess.run(
            [sys.executable, "test_api.py", f"--port={port}"],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        print("\nTests completed.")
        
        # Ask if user wants to keep the server running
        try:
            input("\nServer is still running. Press Enter to stop the server or Ctrl+C to exit...\n")
        except KeyboardInterrupt:
            pass
        finally:
            # Terminate the server process
            print("Stopping server...")
            server_process.terminate()
            server_process.wait(timeout=5)
            print("Server stopped.")
    else:
        # Run the FastAPI application normally
        import uvicorn
        uvicorn.run(
            "app.api:app",
            host="0.0.0.0",
            port=port,
            reload=debug
        ) 