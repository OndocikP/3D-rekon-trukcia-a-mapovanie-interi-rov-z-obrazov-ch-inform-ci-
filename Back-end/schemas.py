from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum

class ProjectStatus(str, Enum):
    pending = "pending"
    generating = "generating"
    generated = "generated"
    failed = "failed"

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Project Schemas
class ProjectCreate(BaseModel):
    project_name: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class ProjectResponse(BaseModel):
    id: str
    project_name: str
    status: ProjectStatus
    description: Optional[str]
    image_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
class TokenData(BaseModel):
    user_id: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
