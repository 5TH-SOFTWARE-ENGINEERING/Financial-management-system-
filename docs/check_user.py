import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))

from app.core.database import SessionLocal
from app.models.user import User

def check_user(username):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            user = db.query(User).filter(User.email == username).first()
        
        if user:
            print(f"User found: {user.username}")
            print(f"IP Restriction Enabled: {user.ip_restriction_enabled}")
            print(f"Allowed IPs: {user.allowed_ips}")
        else:
            print("User not found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        check_user(sys.argv[1])
    else:
        print("Usage: python check_user.py <username_or_email>")
