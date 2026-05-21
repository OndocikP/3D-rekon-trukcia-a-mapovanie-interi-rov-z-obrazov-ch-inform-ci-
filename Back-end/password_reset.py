#!/usr/bin/env python3
"""
Systém na obnovenie hesla s odosielaním emailov
"""

import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from supabase import create_client
import bcrypt

# Load .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")  # App password, nie normálne heslo
RESET_CODE_EXPIRY_MINUTES = int(os.getenv("RESET_CODE_EXPIRY_MINUTES", "30"))


def get_supabase_client():
    """Vytvor Supabase klienta"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL alebo SUPABASE_KEY nie sú nastavené v .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def hash_password(password: str) -> str:
    """
    Zahešuj heslo pomocou bcrypt
    
    Args:
        password: Nezahešované heslo
        
    Returns:
        str: Zahešované heslo
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def send_password_reset_email(email: str, reset_code: str, username: str = "") -> bool:
    """
    Pošli email s kódom na obnovenie hesla
    
    Args:
        email: Email užívateľa
        reset_code: Obnovovací kód
        username: Meno užívateľa (voliteľné)
        
    Returns:
        bool: True ak úspešne, False ak chyba
    """
    try:
        if not SENDER_EMAIL or not SENDER_PASSWORD:
            print("❌ SENDER_EMAIL alebo SENDER_PASSWORD nie sú nastavené v .env")
            return False
        
        # Vytvor správu
        message = MIMEMultipart("alternative")
        message["Subject"] = "Mapero Interier - Password Reset"
        message["From"] = SENDER_EMAIL
        message["To"] = email
        
        # Text verzia
        text = f"""\
Hello {username},

You requested a password reset. Your password reset code is:

{reset_code}

This code is valid for {RESET_CODE_EXPIRY_MINUTES} minutes.

If you did not request this, please ignore this email.

Best regards,
Team Mapero
"""
        
        # HTML verzia
        html = f"""\
<html>
  <body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); min-height: 100vh; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; padding: 30px; background-color: white; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
      
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://drive.google.com/uc?export=view&id=1_RW4DDZyCklfiHWBjqL_hLhIi4EHCs-y" alt="Mapero Interier Logo" style="max-width: 250px; height: auto;">
      </div>
      
      <h2 style="color: #1e40af; text-align: center;">Password Reset</h2>
      <p>Hello <strong>{username}</strong>,</p>
      <p>You requested a password reset. Your password reset code is:</p>
      
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <h1 style="color: white; letter-spacing: 5px; margin: 0; font-size: 36px;">{reset_code}</h1>
      </div>
      
      <p><strong>Valid for:</strong> {RESET_CODE_EXPIRY_MINUTES} minutes</p>
      
      <p style="color: #666; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>
      
      <hr style="border: none; border-top: 2px solid #e0e7ff; margin: 20px 0;">
      <p style="color: #666; font-size: 12px; text-align: center;">Best regards,<br><strong style="color: #1e40af;">Team Mapero</strong></p>
    </div>
  </body>
</html>
"""
        
        # Pridaj časti do správy
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Pošli email
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, message.as_string())
        
        print(f"✅ Email poslal na {email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"❌ Chyba autentifikácie pri odosielaní emailu")
        print("   Skontroluj SENDER_EMAIL a SENDER_PASSWORD v .env")
        return False
    except Exception as e:
        print(f"❌ Chyba pri odosielaní emailu: {e}")
        return False


def create_reset_token(email: str) -> str:
    """
    Vytvor a ulož reset token v Supabase
    
    Args:
        email: Email užívateľa
        
    Returns:
        str: 6-ciferný reset kód
    """
    try:
        supabase = get_supabase_client()
        
        # Генерируй 6-ciferný kód
        reset_code = ''.join(secrets.choice('0123456789') for _ in range(6))
        
        # Vypočítaj expiry čas (timezone-aware)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=RESET_CODE_EXPIRY_MINUTES)
        
        # Ulož v tabuľke password_reset_tokens
        response = supabase.table("password_reset_tokens").insert({
            "email": email,
            "reset_code": reset_code,
            "used": False,
            "created_at": now.isoformat(),
            "expires_at": expires_at.isoformat()
        }).execute()
        
        if response.data:
            print(f"✅ Reset token vytvorený pre {email}")
            return reset_code
        else:
            raise Exception("Nepodarilo sa ulož reset token")
            
    except Exception as e:
        print(f"❌ Chyba pri vytváraní reset tokenu: {e}")
        raise


def verify_reset_code(email: str, reset_code: str) -> dict:
    """
    Overuj či je reset kód platný
    
    Args:
        email: Email užívateľa
        reset_code: Kód na verifikáciu
        
    Returns:
        dict: {'valid': bool, 'message': str, 'token_id': int}
    """
    try:
        supabase = get_supabase_client()
        
        # Hľadaj nepoužitý kód pre daný email
        response = supabase.table("password_reset_tokens") \
            .select("*") \
            .eq("email", email) \
            .eq("reset_code", reset_code) \
            .eq("used", False) \
            .execute()
        
        if not response.data or len(response.data) == 0:
            return {
                "valid": False,
                "message": "Kód neplatný alebo už bol použitý",
                "token_id": None
            }
        
        token = response.data[0]
        
        # Kontroluj či kód vypršal (timezone-aware comparison)
        expires_at_str = token['expires_at']
        # Parse the datetime string and ensure it's timezone-aware
        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        
        if now > expires_at:
            return {
                "valid": False,
                "message": "Kód vypršal. Požiadaj o nový.",
                "token_id": None
            }
        
        return {
            "valid": True,
            "message": "Kód je platný",
            "token_id": token['id']
        }
        
    except Exception as e:
        print(f"❌ Chyba pri overovaní kódu: {e}")
        import traceback
        traceback.print_exc()
        return {
            "valid": False,
            "message": f"Chyba: {str(e)}",
            "token_id": None
        }


def reset_password_with_code(email: str, reset_code: str, new_password: str) -> dict:
    """
    Obnoviť heslo s verifikovaným kódom
    
    Args:
        email: Email užívateľa
        reset_code: Obnovovací kód
        new_password: Nové heslo
        
    Returns:
        dict: {'success': bool, 'message': str}
    """
    try:
        supabase = get_supabase_client()
        
        # Overuj kód
        verification = verify_reset_code(email, reset_code)
        if not verification['valid']:
            return {
                "success": False,
                "message": verification['message']
            }
        
        token_id = verification['token_id']
        
        # Nájdi užívateľa podľa emailu
        user_response = supabase.table("users") \
            .select("id") \
            .eq("email", email) \
            .execute()
        
        if not user_response.data or len(user_response.data) == 0:
            return {
                "success": False,
                "message": "Užívateľ so zadaným emailom neexistuje"
            }
        
        user_id = user_response.data[0]['id']
        
        # Aktualizuj heslo - volaj Supabase RPC funkciu na hashovanie ako pri registrácii
        try:
            password_response = supabase.rpc('reset_user_password_with_hash', {
                'p_user_id': user_id,
                'p_new_password': new_password
            }).execute()
            print(f"✅ Heslo zmenené pomocou RPC s hešovaním (crypt)")
        except Exception as rpc_error:
            # Ak RPC funkcia neexistuje, sprav update priamo s bcrypt hešovaním
            print(f"⚠️  RPC funkcia neexistuje, skúšam priamy update s bcrypt: {rpc_error}")
            hashed_password = hash_password(new_password)
            supabase.table("users").update({
                "password": hashed_password
            }).eq("id", user_id).execute()
            print(f"✅ Heslo zmenené s bcrypt hešovaním")
        
        # Označ token ako použitý
        supabase.table("password_reset_tokens").update({
            "used": True
        }).eq("id", token_id).execute()
        
        return {
            "success": True,
            "message": "Heslo bolo úspešne obnovené"
        }
        
    except Exception as e:
        print(f"❌ Chyba pri obnovovaní hesla: {e}")
        return {
            "success": False,
            "message": f"Chyba: {str(e)}"
        }


def cleanup_expired_tokens():
    """
    Vymaž všetky vypršané tokeny (spusti periodicky)
    """
    try:
        supabase = get_supabase_client()
        
        # Vymaž staré, nepoužité tokeny
        supabase.table("password_reset_tokens") \
            .delete() \
            .lt("expires_at", datetime.now(timezone.utc).isoformat()) \
            .eq("used", False) \
            .execute()
        
        print("✅ Vypršané tokeny vymazané")
        
    except Exception as e:
        print(f"❌ Chyba pri vymazávaní tokenov: {e}")
