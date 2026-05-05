#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8000"

# Test 1: Login as patrik
print("=" * 60)
print("TEST 1: Login as patrik (password: heslo1)")
print("=" * 60)
try:
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "patrik", "password": "heslo1"},
        timeout=5
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"\n✓ Login successful! Token: {token[:50]}...")
        
        # Test 2: Get admin users (requires admin role)
        print("\n" + "=" * 60)
        print("TEST 2: Get admin users (should fail - patrik is not admin)")
        print("=" * 60)
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers=headers,
            timeout=5
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        # Test 3: Login as admin
        print("\n" + "=" * 60)
        print("TEST 3: Login as admin (password: admin123)")
        print("=" * 60)
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=5
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            admin_token = response.json()["access_token"]
            print(f"✓ Admin login successful!")
            
            # Test 4: Get admin users as admin
            print("\n" + "=" * 60)
            print("TEST 4: Get admin users (should succeed - admin is admin)")
            print("=" * 60)
            headers = {"Authorization": f"Bearer {admin_token}"}
            response = requests.get(
                f"{BASE_URL}/api/admin/users",
                headers=headers,
                timeout=5
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)[:500]}")
        else:
            print(f"✗ Admin login failed: {response.text}")
    else:
        print(f"✗ Login failed: {response.text}")
        
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Tests completed!")
print("=" * 60)
