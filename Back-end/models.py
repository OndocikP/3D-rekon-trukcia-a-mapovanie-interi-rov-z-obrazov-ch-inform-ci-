from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum
import uuid

class UserRole(str, enum.Enum):
    user = "user"      # Klasický užívateľ
    admin = "admin"    # Admin

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.user)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    projects = relationship("Project", back_populates="owner")

class ProjectStatus(str, enum.Enum):
    pending = "pending"  # Čakajúci na generovanie
    generating = "generating"  # Práve sa generuje
    generated = "generated"  # Vygenerovaný
    failed = "failed"  # Chyba pri generovaní

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    project_name = Column(String(255), nullable=False)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.pending)
    description = Column(String(500))
    image_count = Column(Integer, default=0)
    objects = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="projects")
