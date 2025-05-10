import time
import random
from typing import Dict, List, Optional, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("edugenie.model_manager")

class ModelManager:
    """
    Manages AI model selection and throttling to avoid rate limits
    """
    
    def __init__(self, models: List[Dict[str, Any]], recommended_models: List[str]):
        """
        Initialize the model manager
        
        Args:
            models: List of available models
            recommended_models: List of recommended model IDs
        """
        self.models = models
        self.recommended_models = recommended_models
        self.model_usage = {}  # Track model usage
        self.model_errors = {}  # Track model errors
        self.call_window = 60 * 60  # 1 hour in seconds
        self.max_calls_per_window = 15  # Maximum calls per model per window
        
    def get_best_model(self, preferred_model_id: Optional[str] = None, exclude_models: List[str] = None) -> str:
        """
        Get the best model to use based on rate limits and preferences
        
        Args:
            preferred_model_id: The preferred model ID, if any
            exclude_models: List of model IDs to exclude
            
        Returns:
            The model ID to use
        """
        current_time = time.time()
        
        # Initialize exclude_models if None
        if exclude_models is None:
            exclude_models = []
        
        # Clean up old usage data
        for model_id in list(self.model_usage.keys()):
            if current_time - self.model_usage[model_id]["timestamp"] > self.call_window:
                del self.model_usage[model_id]
                
        # Clean up old error data
        for model_id in list(self.model_errors.keys()):
            if current_time - self.model_errors[model_id]["timestamp"] > self.call_window:
                del self.model_errors[model_id]
        
        # If preferred model is available and not rate limited, use it
        if preferred_model_id and preferred_model_id not in exclude_models and self._can_use_model(preferred_model_id):
            self._increment_usage(preferred_model_id)
            return preferred_model_id
            
        # Try recommended models in order
        for model_id in self.recommended_models:
            if model_id not in exclude_models and self._can_use_model(model_id):
                self._increment_usage(model_id)
                return model_id
                
        # Fall back to any available model
        available_models = [model["id"] for model in self.models if model["id"] not in exclude_models]
        random.shuffle(available_models)  # Randomize to distribute load
        
        for model_id in available_models:
            if self._can_use_model(model_id):
                self._increment_usage(model_id)
                return model_id
                
        # If all models are rate limited, use the least used one
        least_used = None
        min_usage = float('inf')
        
        for model_id in available_models:
            # Skip models with recent errors
            if model_id in self.model_errors and current_time - self.model_errors[model_id]["timestamp"] < 5 * 60:
                continue
                
            usage = 0
            if model_id in self.model_usage:
                usage = self.model_usage[model_id]["count"]
                
            if usage < min_usage:
                min_usage = usage
                least_used = model_id
                
        if least_used:
            self._increment_usage(least_used)
            return least_used
            
        # Last resort: use the first recommended model that's not excluded
        for model_id in self.recommended_models:
            if model_id not in exclude_models:
                self._increment_usage(model_id)
                return model_id
        
        # Absolute last resort: use the first recommended model even if it's excluded
        default_model = self.recommended_models[0]
        self._increment_usage(default_model)
        return default_model
    
    def _can_use_model(self, model_id: str) -> bool:
        """
        Check if a model can be used based on usage and errors
        
        Args:
            model_id: The model ID to check
            
        Returns:
            True if the model can be used, False otherwise
        """
        current_time = time.time()
        
        # Check for recent errors with this model
        if model_id in self.model_errors:
            error_data = self.model_errors[model_id]
            
            # If the model has had multiple errors recently, avoid it
            if (current_time - error_data["timestamp"] < 5 * 60 and 
                error_data["count"] >= 3):
                return False
        
        # Check usage limits
        if model_id in self.model_usage:
            usage_data = self.model_usage[model_id]
            
            # If within window and exceeded limit
            if (current_time - usage_data["timestamp"] < self.call_window and 
                usage_data["count"] >= self.max_calls_per_window):
                return False
                
        return True
    
    def _increment_usage(self, model_id: str) -> None:
        """
        Increment the usage count for a model
        
        Args:
            model_id: The model ID to increment
        """
        current_time = time.time()
        
        if model_id in self.model_usage:
            # If within window, increment; otherwise reset
            if current_time - self.model_usage[model_id]["timestamp"] < self.call_window:
                self.model_usage[model_id]["count"] += 1
            else:
                self.model_usage[model_id] = {"count": 1, "timestamp": current_time}
        else:
            self.model_usage[model_id] = {"count": 1, "timestamp": current_time}
    
    def record_error(self, model_id: str) -> None:
        """
        Record an error for a model
        
        Args:
            model_id: The model ID that had an error
        """
        current_time = time.time()
        
        if model_id in self.model_errors:
            # If within window, increment; otherwise reset
            if current_time - self.model_errors[model_id]["timestamp"] < self.call_window:
                self.model_errors[model_id]["count"] += 1
            else:
                self.model_errors[model_id] = {"count": 1, "timestamp": current_time}
        else:
            self.model_errors[model_id] = {"count": 1, "timestamp": current_time}
            
    def get_model_stats(self) -> Dict[str, Any]:
        """
        Get current model usage and error statistics
        
        Returns:
            Dictionary with model usage and error information
        """
        stats = {
            "usage": self.model_usage,
            "errors": self.model_errors,
            "recommended_models": self.recommended_models,
            "available_models": [model["id"] for model in self.models]
        }
        
        return stats 