import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
from supabase import create_client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
users = supabase.table('users').select('id').limit(1).execute()
user_id = str(users.data[0]['id']) if users.data else None

if not user_id:
    print("❌ Neboli nájdení žiadni používatelia")
    exit(1)

print(f"📝 Testujem s user_id: {user_id}")

# Test creating project
url = f"http://localhost:8000/api/projects/create/{user_id}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
}
data = {
    "name": "test",
    "description": "test project"
}

response = requests.post(url, json=data, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
