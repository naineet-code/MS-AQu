#!/usr/bin/env python3
"""
Test script to verify TOML configuration is working correctly.
"""

import sys
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from config.credentials import get_credentials_manager, validate_all_credentials
from config.settings import Settings

def test_credentials_loading():
    """Test that credentials can be loaded from TOML file."""
    print("Testing TOML credentials loading...")
    
    try:
        # Test credentials manager
        creds_manager = get_credentials_manager()
        print("✓ Credentials manager initialized successfully")
        
        # Test each model configuration
        for model_type in ['mini', 'main', 'nano']:
            try:
                config = creds_manager.get_azure_config(model_type)
                print(f"✓ {model_type.capitalize()} model config loaded:")
                print(f"  - Endpoint: {config['endpoint']}")
                print(f"  - Deployment: {config['deployment_name']}")
                print(f"  - API Version: {config['api_version']}")
                print(f"  - API Key: {config['api_key'][:8]}...")
            except Exception as e:
                print(f"✗ Failed to load {model_type} model config: {e}")
                return False
        
        # Test app configuration
        try:
            app_config = creds_manager.get_app_config()
            print(f"✓ App config loaded:")
            print(f"  - Backend URL: {app_config.get('backend_url', 'Not set')}")
            print(f"  - PDF Dir: {app_config.get('pdf_dir', 'Not set')}")
            print(f"  - Log Level: {app_config.get('log_level', 'Not set')}")
        except Exception as e:
            print(f"✗ Failed to load app config: {e}")
            return False
        
        # Test credential validation
        if validate_all_credentials():
            print("✓ All credentials validated successfully")
        else:
            print("⚠ Credential validation failed - check your cred.toml file")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing credentials: {e}")
        return False

def test_settings_loading():
    """Test that settings can be loaded using TOML configuration."""
    print("\nTesting Settings loading...")
    
    try:
        settings = Settings()
        print("✓ Settings initialized successfully")
        
        # Test some key settings
        test_keys = [
            "AZURE_OPENAI_API_KEY_MINI",
            "AZURE_OPENAI_ENDPOINT_MINI",
            "AZURE_OPENAI_API_VERSION_MINI",
            "PDF_DIR",
            "LOG_LEVEL"
        ]
        
        for key in test_keys:
            value = settings.get(key)
            if value:
                if "API_KEY" in key:
                    print(f"✓ {key}: {value[:8]}...")
                else:
                    print(f"✓ {key}: {value}")
            else:
                print(f"⚠ {key}: Not set")
        
        # Test validation
        if settings.validate():
            print("✓ Settings validation passed")
        else:
            print("✗ Settings validation failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing settings: {e}")
        return False

def main():
    """Main test function."""
    print("=== TOML Configuration Test ===\n")
    
    # Test credentials loading
    creds_success = test_credentials_loading()
    
    # Test settings loading
    settings_success = test_settings_loading()
    
    # Summary
    print("\n=== Test Summary ===")
    if creds_success and settings_success:
        print("✓ All tests passed! TOML configuration is working correctly.")
        return 0
    else:
        print("✗ Some tests failed. Please check your configuration.")
        return 1

if __name__ == "__main__":
    exit(main()) 