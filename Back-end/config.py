from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Email
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    sender_email: Optional[str] = None
    sender_password: Optional[str] = None
    
    # Server
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:8081"
    
    class Config:
        env_file = ".env"

settings = Settings()
