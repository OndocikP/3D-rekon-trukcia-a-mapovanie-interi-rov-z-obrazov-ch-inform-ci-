#!/usr/bin/env python3
"""
Test script na testovanie auth flow
Spusti: python test_auth.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Test User
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
}

def test_register():
    """1. Registruj nového používateľa"""
    print("\n[1] Registrácia nového používateľa...")
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=TEST_USER
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.status_code == 200

def test_login():
    """2. Prihlás sa"""
    print("\n[2] Prihlásenie...")
    login_data = {
        "username": TEST_USER["username"],
        "password": TEST_USER["password"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=login_data
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_get_user(token):
    """3. Získaj dáta aktuálneho používateľa"""
    print("\n[3] Načítanie dát používateľa...")
    response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    print("=" * 50)
    print("3D Rekon Backend - Auth Test")
    print("=" * 50)
    
    # 1. Registrácia
    if test_register():
        # 2. Login
        token = test_login()
        
        # 3. Get User
        if token:
            test_get_user(token)
    
    print("\n" + "=" * 50)
    print("✓ Testovanie skončené!")
    print("=" * 50)
