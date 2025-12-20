#!/usr/bin/env python3
"""
Database Initialization Script
Creates database tables and default admin user
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
import bcrypt

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def init_database():
    """Initialize database with tables and default admin user"""
    print("Initializing database...")
    
    # 1. Create all tables
    print("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created successfully")
    except Exception as e:
        print(f"[ERROR] Failed to create database tables: {e}")
        return False
    
    # 2. Create default admin user if it doesn't exist
    print("Creating default admin user...")
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@expense.com").first()
        if admin:
            print("[OK] Admin user already exists")
        else:
            # Create admin user directly
            admin_email = "admin@expense.com"
            admin_username = "admin"
            admin_password = "admin1234"
            
            hashed = get_password_hash(admin_password)
            admin = User(
                email=admin_email,
                username=admin_username,
                hashed_password=hashed,
                full_name="Default Administrator",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Admin user created: {admin_email} / {admin_password}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Failed to create admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = init_database()
    if success:
        print("\n[OK] Database initialization complete!")
        print("You can now run: python import_csv_data.py --all")
    else:
        print("\n[ERROR] Database initialization failed!")
        sys.exit(1)

