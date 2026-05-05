"""
Minimálna konfigurácia - Proxy API k Supabase
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # JWT (pre tokeny)
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    
    # Server
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:8081"
    
    class Config:
        env_file = ".env"

settings = Settings()
