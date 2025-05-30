#!/usr/bin/env python3
"""
Test script to verify the cache fix is working.
This will make the same query twice and verify we get a cache hit on the second attempt.
"""

import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_QUERY = "What is WSSI?"
CATEGORY = "reliance"

def test_cache_functionality():
    print("🧪 Testing Cache Functionality After Bug Fix")
    print("=" * 50)
    
    # First request - should be a cache miss
    print(f"📤 Making first request: '{TEST_QUERY}'")
    
    first_response = requests.post(f"{BASE_URL}/api/query", json={
        "query": TEST_QUERY,
        "category": CATEGORY,
        "force_no_cache": False
    })
    
    if first_response.status_code == 200:
        first_data = first_response.json()
        print(f"✅ First request successful")
        print(f"   Cache Hit: {first_data.get('cache_hit', False)}")
        print(f"   Response length: {len(first_data.get('answer', ''))}")
    else:
        print(f"❌ First request failed: {first_response.status_code}")
        return False
    
    # Wait a moment
    print("\n⏳ Waiting 2 seconds...")
    time.sleep(2)
    
    # Second request - should be a cache hit
    print(f"📤 Making second request (identical): '{TEST_QUERY}'")
    
    second_response = requests.post(f"{BASE_URL}/api/query", json={
        "query": TEST_QUERY,
        "category": CATEGORY,
        "force_no_cache": False
    })
    
    if second_response.status_code == 200:
        second_data = second_response.json()
        print(f"✅ Second request successful")
        print(f"   Cache Hit: {second_data.get('cache_hit', False)}")
        print(f"   Response length: {len(second_data.get('answer', ''))}")
        
        # Check if we got a cache hit
        if second_data.get('cache_hit', False):
            print("\n🎉 SUCCESS: Cache hit detected!")
            print(f"   Similarity Score: {second_data.get('similarity_score', 'N/A')}")
            print(f"   Match Type: {second_data.get('match_type', 'N/A')}")
            if 'nano_verification' in second_data:
                nano_verification = second_data['nano_verification']
                print(f"   Nano Verification Confidence: {nano_verification.get('confidence', 'N/A')}%")
            return True
        else:
            print("\n❌ FAILURE: No cache hit on identical query")
            return False
    else:
        print(f"❌ Second request failed: {second_response.status_code}")
        return False

def test_force_no_cache():
    print("\n🔄 Testing Force No Cache Functionality")
    print("=" * 50)
    
    response = requests.post(f"{BASE_URL}/api/query", json={
        "query": TEST_QUERY,
        "category": CATEGORY,
        "force_no_cache": True
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Force no cache request successful")
        print(f"   Cache Hit: {data.get('cache_hit', False)}")
        print(f"   Forced No Cache: {data.get('forced_no_cache', False)}")
        
        if not data.get('cache_hit', False) and data.get('forced_no_cache', False):
            print("🎉 SUCCESS: Force no cache working correctly")
            return True
        else:
            print("❌ FAILURE: Force no cache not working properly")
            return False
    else:
        print(f"❌ Force no cache request failed: {response.status_code}")
        return False

def test_cache_stats():
    print("\n📊 Checking Cache Statistics")
    print("=" * 50)
    
    response = requests.get(f"{BASE_URL}/api/ai-status")
    
    if response.status_code == 200:
        data = response.json()
        cache_stats = data.get('cache', {}).get('status', {})
        performance = cache_stats.get('performance', {})
        
        print(f"✅ Cache stats retrieved")
        print(f"   Status: {cache_stats.get('status', 'Unknown')}")
        print(f"   Total Queries: {performance.get('total_queries', 0)}")
        print(f"   Cache Hits: {performance.get('cache_hits', 0)}")
        print(f"   Cache Misses: {performance.get('cache_misses', 0)}")
        print(f"   Hit Rate: {performance.get('hit_rate', 0)}%")
        return True
    else:
        print(f"❌ Cache stats request failed: {response.status_code}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Cache Fix Verification Test\n")
    
    # Test main cache functionality
    cache_test_passed = test_cache_functionality()
    
    # Test force no cache
    force_no_cache_passed = test_force_no_cache()
    
    # Check cache stats
    stats_test_passed = test_cache_stats()
    
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    print(f"Cache Functionality: {'✅ PASS' if cache_test_passed else '❌ FAIL'}")
    print(f"Force No Cache:      {'✅ PASS' if force_no_cache_passed else '❌ FAIL'}")
    print(f"Cache Statistics:    {'✅ PASS' if stats_test_passed else '❌ FAIL'}")
    
    if cache_test_passed and force_no_cache_passed and stats_test_passed:
        print("\n🎉 ALL TESTS PASSED! Cache fix is working correctly.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.") 