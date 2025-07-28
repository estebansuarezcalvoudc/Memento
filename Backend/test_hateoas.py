#!/usr/bin/env python3
"""
Simple test script to validate HATEOAS implementation
"""
import requests
import json
import time
from datetime import datetime

# Base URL for testing
BASE_URL = "http://localhost:8000/api/v1"

def test_hateoas_links():
    """Test HATEOAS links in the Meeting API"""
    print("Testing HATEOAS implementation...")
    
    # Test 1: Get empty meetings list with pagination links
    print("\n1. Testing empty meetings list...")
    response = requests.get(f"{BASE_URL}/meetings")
    data = response.json()
    
    assert "links" in data, "Response should contain links"
    assert any(link["rel"] == "self" for link in data["links"]), "Should have self link"
    assert any(link["rel"] == "create" for link in data["links"]), "Should have create link"
    print("✓ Empty list contains proper HATEOAS links")
    
    # Test 2: Create a meeting and check response links
    print("\n2. Testing meeting creation...")
    meeting_data = {
        "title": "Test Meeting",
        "description": "Test description",
        "start_time": "2024-07-29T10:00:00",
        "end_time": "2024-07-29T11:00:00",
        "location": "Test Room"
    }
    
    response = requests.post(f"{BASE_URL}/meetings", json=meeting_data)
    created_meeting = response.json()
    
    assert "links" in created_meeting, "Created meeting should contain links"
    assert any(link["rel"] == "self" for link in created_meeting["links"]), "Should have self link"
    assert any(link["rel"] == "update" for link in created_meeting["links"]), "Should have update link"
    assert any(link["rel"] == "delete" for link in created_meeting["links"]), "Should have delete link"
    assert any(link["rel"] == "collection" for link in created_meeting["links"]), "Should have collection link"
    print("✓ Created meeting contains proper HATEOAS links")
    
    meeting_id = created_meeting["id"]
    
    # Test 3: Get individual meeting and check links
    print("\n3. Testing individual meeting retrieval...")
    response = requests.get(f"{BASE_URL}/meetings/{meeting_id}")
    meeting = response.json()
    
    assert "links" in meeting, "Meeting should contain links"
    assert any(link["rel"] == "self" for link in meeting["links"]), "Should have self link"
    print("✓ Individual meeting contains proper HATEOAS links")
    
    # Test 4: Create more meetings to test pagination links
    print("\n4. Testing pagination links...")
    for i in range(2, 12):
        meeting_data["title"] = f"Meeting {i}"
        requests.post(f"{BASE_URL}/meetings", json=meeting_data)
    
    # Get page 2 with page_size=5
    response = requests.get(f"{BASE_URL}/meetings?page=2&page_size=5")
    paginated_data = response.json()
    
    assert "links" in paginated_data, "Paginated response should contain links"
    
    # Check for pagination links
    link_rels = [link["rel"] for link in paginated_data["links"]]
    assert "self" in link_rels, "Should have self link"
    assert "create" in link_rels, "Should have create link"
    assert "first" in link_rels, "Should have first link (not on first page)"
    assert "prev" in link_rels, "Should have prev link (not on first page)"
    assert "next" in link_rels, "Should have next link (not on last page)"
    print("✓ Pagination links are correctly generated")
    
    # Test 5: Update meeting and check links
    print("\n5. Testing meeting update...")
    update_data = {"title": "Updated Test Meeting"}
    response = requests.put(f"{BASE_URL}/meetings/{meeting_id}", json=update_data)
    updated_meeting = response.json()
    
    assert "links" in updated_meeting, "Updated meeting should contain links"
    assert updated_meeting["title"] == "Updated Test Meeting", "Title should be updated"
    print("✓ Updated meeting contains proper HATEOAS links")
    
    print("\n🎉 All HATEOAS tests passed!")

if __name__ == "__main__":
    test_hateoas_links()