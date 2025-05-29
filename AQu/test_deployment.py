import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test the health endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print(f"Health check status: {response.status_code}")
    return response.status_code == 200

def test_ai_apis():
    """Test the AI APIs"""
    # Test the unified RAG endpoint
    test_query = {
        "query": "What is the main purpose of this system?",
        "category": "reliance"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/query", json=test_query)
        print(f"\nUnified RAG API Test:")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", json.dumps(response.json(), indent=2))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Error testing Unified RAG API: {str(e)}")

    # Test the analyze endpoint
    test_analysis = {
        "text": "This is a test text for analysis.",
        "analysis_type": "sentiment"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/analyze", json=test_analysis)
        print(f"\nAnalyze API Test:")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Response:", json.dumps(response.json(), indent=2))
        else:
            print("Error:", response.text)
    except Exception as e:
        print(f"Error testing Analyze API: {str(e)}")

if __name__ == "__main__":
    print("Testing backend deployment...")
    
    if test_health():
        print("\nHealth check passed!")
        test_ai_apis()
    else:
        print("\nHealth check failed! Backend might not be running properly.") 