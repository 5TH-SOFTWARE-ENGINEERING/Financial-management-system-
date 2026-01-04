import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), 'backend')))

from app.core.database import SessionLocal
from app.models.ip_restriction import IPRestriction

def check_ips():
    db = SessionLocal()
    try:
        restrictions = db.query(IPRestriction).all()
        print(f"Total IP Restrictions: {len(restrictions)}")
        for r in restrictions:
            print(f"ID: {r.id}, IP: {r.ip_address}, Status: {r.status}, Description: {r.description}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_ips()
