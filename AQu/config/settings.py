import os
from pathlib import Path
from typing import Dict, Any
import json
import logging

class Settings:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.base_dir = Path(__file__).parent.parent
        self.config: Dict[str, Any] = {}
        self._load_config()
        
    def _load_config(self) -> None:
        """Load configuration from environment variables and config files."""
        try:
            # Load environment variables
            self.config.update({
                "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY"),
                "AZURE_OPENAI_API_VERSION": os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
                "AZURE_OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT"),
                "PDF_DIR": os.getenv("PDF_DIR", str(self.base_dir / "static/pdfs")),
                "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO"),
                "MODEL_NAME": os.getenv("MODEL_NAME", "gpt-4-1106-preview"),
                "MAX_TOKENS": int(os.getenv("MAX_TOKENS", "800")),
                "TEMPERATURE": float(os.getenv("TEMPERATURE", "0.7"))
            })
            
            # Load additional config from file if exists
            config_file = self.base_dir / "config" / "config.json"
            if config_file.exists():
                with open(config_file) as f:
                    self.config.update(json.load(f))
                    
            self.logger.info("Configuration loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading configuration: {str(e)}")
            raise
            
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        return self.config.get(key, default)
        
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        self.config[key] = value
        
    def save(self) -> None:
        """Save configuration to file."""
        try:
            config_file = self.base_dir / "config" / "config.json"
            with open(config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
            self.logger.info("Configuration saved successfully")
        except Exception as e:
            self.logger.error(f"Error saving configuration: {str(e)}")
            raise
            
    def validate(self) -> bool:
        """Validate the configuration."""
        required_keys = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT"
        ]
        
        missing_keys = [key for key in required_keys if not self.config.get(key)]
        if missing_keys:
            self.logger.error(f"Missing required configuration keys: {missing_keys}")
            return False
            
        return True 