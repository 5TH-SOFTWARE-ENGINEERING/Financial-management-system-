#!/usr/bin/env python3
"""
Migration script to add permissions column to users table.

This script adds the following column to the users table:
- permissions (JSON/TEXT, nullable=True) - Custom user permissions

Usage:
    python migrate_add_permissions_column.py
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
    """Run the migration to add permissions column."""
    print("=" * 60)
    print("Migration: Add Permissions Column to Users Table")
    print("=" * 60)
    
    connection = engine.connect()
    
    try:
        # Check if users table exists
        inspector = inspect(connection)
        if 'users' not in inspector.get_table_names():
            print("[ERROR] 'users' table does not exist!")
            print("   Please run the application first to create base tables.")
            return False
        
        print("\n[OK] Users table exists")
        print("\nChecking existing columns...")
        
        # Get existing columns
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        print(f"  Existing columns: {', '.join(existing_columns)}")
        
        # Check if permissions column already exists
        if 'permissions' in existing_columns:
            print("\n[OK] Column 'permissions' already exists, skipping migration")
            return True
        
        print("\nAdding permissions column...")
        
        # Determine column definition based on database type
        dialect = connection.dialect.name
        
        try:
            if dialect == 'sqlite':
                # SQLite stores JSON as TEXT
                print("  Adding column: permissions (TEXT for JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN permissions TEXT"))
                connection.commit()
                print("    [OK] Column permissions added successfully")
            
            elif dialect == 'postgresql':
                # PostgreSQL supports JSON/JSONB
                print("  Adding column: permissions (JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN permissions JSON"))
                connection.commit()
                print("    [OK] Column permissions added successfully")
            
            elif dialect == 'mysql':
                # MySQL uses JSON type
                print("  Adding column: permissions (JSON)")
                connection.execute(text("ALTER TABLE users ADD COLUMN permissions JSON"))
                connection.commit()
                print("    [OK] Column permissions added successfully")
            
            else:
                print(f"[ERROR] Unsupported database dialect: {dialect}")
                return False
            
            print("\n[OK] Migration completed successfully!")
            
            # Verify the column was added
            print("\nVerifying migration...")
            inspector = inspect(connection)
            final_columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'permissions' not in final_columns:
                print("[ERROR] Warning: Column 'permissions' is still missing")
                return False
            else:
                print("  [OK] Column 'permissions' is present")
                return True
        
        except Exception as e:
            connection.rollback()
            print(f"\n[ERROR] Error during migration: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    except Exception as e:
        print(f"\n[ERROR] Error connecting to database: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        connection.close()


if __name__ == "__main__":
    print(f"\nDatabase URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print(f"Database Type: {engine.dialect.name}\n")
    
    success = migrate()
    
    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] Migration completed successfully!")
        print("=" * 60)
        print("\nYou can now restart your backend server.")
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("[FAILED] Migration failed!")
        print("=" * 60)
        print("\nPlease check the error messages above and try again.")
        sys.exit(1)

