#!/usr/bin/env python3
"""
Comprehensive test script for AI functionality
Tests all endpoints and AI models
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_ai_status():
    """Test AI credentials status endpoint."""
    print("🔍 Testing AI Status Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/ai-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ AI Status: {data['overall_status']}")
            for model_type, model_info in data['models'].items():
                print(f"  {model_type.upper()}: {model_info['status']} ({model_info['response_time_ms']}ms)")
                print(f"    Model: {model_info['model_name']}")
                print(f"    Functions: {', '.join(model_info['functions'])}")
            return True
        else:
            print(f"❌ AI Status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing AI status: {e}")
        return False

def test_pdf_loading():
    """Test PDF loading functionality."""
    print("\n📚 Testing PDF Loading...")
    try:
        # Get available PDFs
        response = requests.get(f"{BASE_URL}/api/pdfs")
        if response.status_code == 200:
            pdfs = response.json()['pdfs']
            print(f"✅ Available PDFs: {pdfs}")
            
            # Try to load a PDF
            if pdfs:
                # Try to determine category from PDF name
                test_pdf = pdfs[0]
                if "reliance" in test_pdf.lower():
                    category = "reliance"
                elif "merchandising" in test_pdf.lower():
                    category = "merchandising"
                else:
                    category = "test"
                
                print(f"🔄 Loading PDF: {test_pdf} (category: {category})")
                load_response = requests.get(f"{BASE_URL}/api/load-pdf/{category}")
                if load_response.status_code == 200:
                    load_data = load_response.json()
                    print(f"✅ PDF loaded successfully: {load_data['message']}")
                    print(f"  Paragraphs loaded: {len(load_data.get('paragraphs', []))}")
                    return category
                else:
                    print(f"❌ PDF loading failed: {load_response.status_code}")
                    print(load_response.text)
            return None
        else:
            print(f"❌ Failed to get PDFs: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error testing PDF loading: {e}")
        return None

def test_query_functionality(category):
    """Test the query functionality with AI."""
    print(f"\n🤖 Testing Query Functionality (Category: {category})...")
    try:
        test_queries = [
            "What are the main benefits?",
            "How does the system work?",
            "What are the requirements?"
        ]
        
        for query in test_queries:
            print(f"\n🔍 Testing query: '{query}'")
            response = requests.post(
                f"{BASE_URL}/api/query",
                json={"query": query, "category": category}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Query successful!")
                print(f"  Answer: {data.get('answer', 'No answer')[:100]}...")
                print(f"  Model used: {data.get('model', 'Unknown')}")
                print(f"  Costs: {len(data.get('costs', []))} cost entries")
                print(f"  Citations: {len(data.get('citations', []))} citations")
                
                # Show cost breakdown
                if data.get('costs'):
                    total_cost = sum(cost.get('totalCost', 0) for cost in data['costs'])
                    print(f"  Total cost: ${total_cost:.6f}")
            else:
                print(f"❌ Query failed: {response.status_code}")
                print(response.text)
            
            time.sleep(1)  # Small delay between requests
            
        return True
    except Exception as e:
        print(f"❌ Error testing query functionality: {e}")
        return False

def test_main_status_page():
    """Test the main status page."""
    print("\n🌐 Testing Main Status Page...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            html_content = response.text
            if "AI Models Status" in html_content and "Overall Status:" in html_content:
                print("✅ Status page loaded successfully with AI status!")
                return True
            else:
                print("⚠️ Status page loaded but AI status section may be missing")
                return False
        else:
            print(f"❌ Status page failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing status page: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting Comprehensive AI Functionality Test\n")
    
    results = {}
    
    # Test AI Status
    results['ai_status'] = test_ai_status()
    
    # Test PDF Loading
    category = test_pdf_loading()
    results['pdf_loading'] = category is not None
    
    # Test Query Functionality (only if PDF loading worked)
    if category:
        results['query_functionality'] = test_query_functionality(category)
    else:
        results['query_functionality'] = False
        print("\n⚠️ Skipping query tests due to PDF loading failure")
    
    # Test Status Page
    results['status_page'] = test_main_status_page()
    
    # Summary
    print(f"\n{'='*50}")
    print("🎯 Test Results Summary:")
    print(f"{'='*50}")
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {test_name.replace('_', ' ').title()}: {status}")
    
    all_passed = all(results.values())
    overall_status = "✅ ALL TESTS PASSED" if all_passed else "⚠️ SOME TESTS FAILED"
    print(f"\nOverall Status: {overall_status}")
    
    if all_passed:
        print("\n🎉 Your AI API credentials check is working perfectly!")
        print("🌐 Access the status page at: http://57.154.209.147:8000/")
        print("🔧 API endpoint for AI status: http://57.154.209.147:8000/api/ai-status")
    
    return all_passed

if __name__ == "__main__":
    main() 