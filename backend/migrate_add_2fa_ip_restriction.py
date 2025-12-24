#!/usr/bin/env python3
"""
Migration script to add 2FA and IP Restriction columns to users table.

This script adds the following columns to the users table:
- is_2fa_enabled (Boolean, default=False)
- ip_restriction_enabled (Boolean, default=False)  
- allowed_ips (String, nullable=True)

Usage:
    python migrate_add_2fa_ip_restriction.py
"""

import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import engine, SessionLocal


def column_exists(connection, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    inspector = inspect(connection)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def add_column_if_not_exists(connection, table_name: str, column_definition: str):
    """Add a column to a table if it doesn't exist."""
    # Extract column name from definition (assumes format: "column_name TYPE ...")
    column_name = column_definition.split()[0].strip()
    
    inspector = inspect(connection)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    
    if column_name not in columns:
        print(f"  Adding column: {column_name}")
        
        # Get the database dialect
        dialect = connection.dialect.name
        
        if dialect == 'sqlite':
            # SQLite has limited ALTER TABLE support - use ALTER TABLE ADD COLUMN
            # SQLite doesn't support adding NOT NULL columns with DEFAULT in a single statement
            # So we add the column as nullable first, then set defaults
            try:
                # Add column as nullable first
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}"))
                connection.commit()
                print(f"    ✓ Column {column_name} added successfully")
            except OperationalError as e:
                print(f"    ✗ Error adding column {column_name}: {e}")
                connection.rollback()
                raise
        elif dialect in ('postgresql', 'mysql'):
            # PostgreSQL and MySQL support full ALTER TABLE syntax
            try:
                connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}"))
                connection.commit()
                print(f"    ✓ Column {column_name} added successfully")
            except OperationalError as e:
                print(f"    ✗ Error adding column {column_name}: {e}")
                connection.rollback()
                raise
        else:
            print(f"    [WARNING] Unsupported database dialect: {dialect}")
            print(f"    Please add column {column_name} manually")
    else:
        print(f"  Column {column_name} already exists, skipping")


def set_column_defaults(connection, table_name: str):
    """Set default values for boolean columns in existing rows."""
    inspector = inspect(connection)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    
    # Update existing rows to set default values
    if 'is_2fa_enabled' in columns:
        try:
            connection.execute(text(f"UPDATE {table_name} SET is_2fa_enabled = 0 WHERE is_2fa_enabled IS NULL"))
            connection.commit()
        except Exception as e:
            print(f"    [WARNING] Could not set defaults for is_2fa_enabled: {e}")
            connection.rollback()
    
    if 'ip_restriction_enabled' in columns:
        try:
            connection.execute(text(f"UPDATE {table_name} SET ip_restriction_enabled = 0 WHERE ip_restriction_enabled IS NULL"))
            connection.commit()
        except Exception as e:
            print(f"    [WARNING] Could not set defaults for ip_restriction_enabled: {e}")
            connection.rollback()


def migrate():
    """Run the migration to add 2FA and IP restriction columns."""
    print("=" * 60)
    print("Migration: Add 2FA and IP Restriction Columns to Users Table")
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
        
        print("\nAdding missing columns...")
        
        # Determine column definitions based on database type
        dialect = connection.dialect.name
        
        try:
            if dialect == 'sqlite':
                # SQLite doesn't support NOT NULL with DEFAULT in ALTER TABLE ADD COLUMN
                # So we add as nullable, then set defaults
                if 'is_2fa_enabled' not in existing_columns:
                    print("  Adding column: is_2fa_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT 0"))
                    connection.commit()
                
                if 'ip_restriction_enabled' not in existing_columns:
                    print("  Adding column: ip_restriction_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN ip_restriction_enabled BOOLEAN DEFAULT 0"))
                    connection.commit()
                
                if 'allowed_ips' not in existing_columns:
                    print("  Adding column: allowed_ips")
                    connection.execute(text("ALTER TABLE users ADD COLUMN allowed_ips TEXT"))
                    connection.commit()
            
            elif dialect == 'postgresql':
                # PostgreSQL supports full ALTER TABLE syntax
                if 'is_2fa_enabled' not in existing_columns:
                    print("  Adding column: is_2fa_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE"))
                    connection.commit()
                
                if 'ip_restriction_enabled' not in existing_columns:
                    print("  Adding column: ip_restriction_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN ip_restriction_enabled BOOLEAN NOT NULL DEFAULT FALSE"))
                    connection.commit()
                
                if 'allowed_ips' not in existing_columns:
                    print("  Adding column: allowed_ips")
                    connection.execute(text("ALTER TABLE users ADD COLUMN allowed_ips TEXT"))
                    connection.commit()
            
            elif dialect == 'mysql':
                # MySQL syntax
                if 'is_2fa_enabled' not in existing_columns:
                    print("  Adding column: is_2fa_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE"))
                    connection.commit()
                
                if 'ip_restriction_enabled' not in existing_columns:
                    print("  Adding column: ip_restriction_enabled")
                    connection.execute(text("ALTER TABLE users ADD COLUMN ip_restriction_enabled BOOLEAN NOT NULL DEFAULT FALSE"))
                    connection.commit()
                
                if 'allowed_ips' not in existing_columns:
                    print("  Adding column: allowed_ips")
                    connection.execute(text("ALTER TABLE users ADD COLUMN allowed_ips TEXT"))
                    connection.commit()
            
            else:
                print(f"[ERROR] Unsupported database dialect: {dialect}")
                return False
            
            print("\n[OK] Migration completed successfully!")
            
            # Verify the columns were added
            print("\nVerifying migration...")
            inspector = inspect(connection)
            final_columns = [col['name'] for col in inspector.get_columns('users')]
            
            required_columns = ['is_2fa_enabled', 'ip_restriction_enabled', 'allowed_ips']
            missing = [col for col in required_columns if col not in final_columns]
            
            if missing:
                print(f"[ERROR] Warning: Some columns are still missing: {missing}")
                return False
            else:
                print("  [OK] All required columns are present:")
                for col in required_columns:
                    print(f"    - {col}")
                return True
        
        except Exception as e:
            trans.rollback() #type: ignore
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

