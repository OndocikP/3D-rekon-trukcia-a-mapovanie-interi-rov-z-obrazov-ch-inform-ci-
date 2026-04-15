from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import timedelta
from models import User
from schemas import UserCreate, UserResponse, Token, LoginRequest, ForgotPasswordRequest
from database import get_db
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_user_by_username, get_user_by_email, verify_token
)
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registrácia nového používateľa"""
    
    # Skontroluj, či používateľ existuje
    existing_user = get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Používateľ s týmto menom už existuje"
        )
    
    # Skontroluj, či email existuje
    existing_email = get_user_by_email(db, user.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email je už registrovaný"
        )
    
    # Vytvor nového používateľa
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Prihlásenie používateľa"""
    
    user = get_user_by_username(db, credentials.username)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nesprávne meno alebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/admin/login", response_model=Token)
async def admin_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Prihlásenie admin užívateľa"""
    
    user = get_user_by_username(db, credentials.username)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nesprávne meno alebo heslo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Skontroluj či je admin
    if str(user.role) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nemáš práva na prístup do admin panelu"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Zaslanie odkazu na obnovenie hesla (zatiaľ bez emailu)"""
    
    user = get_user_by_email(db, request.email)
    if not user:
        # Z bezpečnostných dôvodov nevraćame, či email existuje
        return {"message": "Ak email existuje, bude zaslané heslo na obnovenie"}
    
    # TODO: Implementovať posielanie emailu
    # token = create_access_token(data={"sub": user.id}, expires_delta=timedelta(hours=1))
    # send_reset_email(user.email, token)
    
    return {"message": "Ak email existuje, bude zaslané heslo na obnovenie"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Získať aktuálneho používateľa"""
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header nie je poskytnutý"
        )
    
    # Extrahovať token z "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný Authorization header format"
        )
    
    token_data = verify_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Neplatný token"
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Používateľ nenájdený"
        )
    
    return user
