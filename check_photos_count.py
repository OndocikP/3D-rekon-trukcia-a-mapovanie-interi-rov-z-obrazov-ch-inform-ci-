from supabase import create_client
import json
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Načítaj projekt
project_id = "6f2c22b8-d8c6-4011-85b7-2f67d41712ed"
response = supabase.table('projects').select('*').eq('id', project_id).execute()

print(f"📊 PROJECT DATA FROM SUPABASE:")
print(json.dumps(response.data, indent=2))

if response.data:
    project = response.data[0]
    print(f"\n✅ Photos count: {project.get('photos_count')}")
    print(f"✅ Project name: {project.get('name')}")
    print(f"✅ Status: {project.get('status')}")
