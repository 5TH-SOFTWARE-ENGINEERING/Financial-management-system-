#!/usr/bin/env python3
"""
Migration script to add notification_preferences column to users table.

This script adds the following column to the users table:
- notification_preferences (JSON/TEXT, nullable=True) - User notification preferences

Usage:
    python migrate_add_notification_preferences.py
"""

import sys
import os
from sqlalchemy import create_engine, text, inspect # type: ignore[import-untyped]
from sqlalchemy.exc import OperationalError # type: ignore[import-untyped]

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import engine


def migrate():
    """Run the migration to add notification_preferences column."""
    print("=" * 60)
    print("Migration: Add Notification Preferences Column to Users Table")
    print("=" * 60)
    
    connection = engine.connect()
    
    try:
        # Check if users table exists
        inspector = inspect(connection)
        tables = inspector.get_table_names()
        
        if 'users' not in tables:
            print("[ERROR] Table 'users' does not exist")
            return False
        
        # Check if column already exists
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        if 'notification_preferences' in existing_columns:
            print("[INFO] Column 'notification_preferences' already exists. Skipping migration.")
            return True
        
        print("\nAdding notification_preferences column...")
        
        # Determine column definition based on database type
        dialect = connection.dialect.name
        
        try:
            if dialect == 'sqlite':
                # SQLite stores JSON as TEXT
                print("  Adding column: notification_preferences (TEXT for JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN notification_preferences TEXT"))
                connection.commit()
                print("    [OK] Column notification_preferences added successfully")
            
            elif dialect == 'postgresql':
                # PostgreSQL supports JSON/JSONB
                print("  Adding column: notification_preferences (JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN notification_preferences JSON"))
                connection.commit()
                print("    [OK] Column notification_preferences added successfully")
            
            elif dialect == 'mysql':
                # MySQL uses JSON type
                print("  Adding column: notification_preferences (JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN notification_preferences JSON"))
                connection.commit()
                print("    [OK] Column notification_preferences added successfully")
            
            else:
                print(f"[ERROR] Unsupported database dialect: {dialect}")
                return False
            
            print("\n[OK] Migration completed successfully!")
            
            # Verify the column was added
            print("\nVerifying migration...")
            inspector = inspect(connection)
            final_columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'notification_preferences' not in final_columns:
                print("[ERROR] Warning: Column 'notification_preferences' is still missing")
                return False
            else:
                print("  [OK] Column 'notification_preferences' is present")
                return True
        
        except Exception as e:
            print(f"[ERROR] Failed to add column: {str(e)}")
            connection.rollback()
            return False
    
    except OperationalError as e:
        print(f"[ERROR] Database connection error: {str(e)}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return False
    finally:
        connection.close()


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)

