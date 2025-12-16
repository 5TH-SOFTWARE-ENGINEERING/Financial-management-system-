# app/utils/encryption.py
"""
Encryption utilities for sensitive financial data.
Uses Fernet symmetric encryption for cost-related fields.
"""
from cryptography.fernet import Fernet # type: ignore[import-untyped]
from ..core.config import settings
import base64
import hashlib
from typing import Optional

# Generate encryption key from SECRET_KEY if not provided
def _get_encryption_key() -> bytes:
    """Generate a Fernet key from SECRET_KEY"""
    secret = settings.SECRET_KEY.encode('utf-8')
    # Use SHA256 to get a 32-byte key, then base64 encode for Fernet
    key = hashlib.sha256(secret).digest()
    return base64.urlsafe_b64encode(key)

# Initialize Fernet cipher
_cipher = Fernet(_get_encryption_key())

def encrypt_value(value: float) -> str:
    """Encrypt a float value (for buying_price, expense_amount, etc.)"""
    if value is None:
        return None
    value_str = str(value)
    encrypted = _cipher.encrypt(value_str.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_value(encrypted_value: str) -> Optional[float]:
    """Decrypt an encrypted value back to float"""
    if encrypted_value is None:
        return None
    try:
        decrypted = _cipher.decrypt(encrypted_value.encode('utf-8'))
        return float(decrypted.decode('utf-8'))
    except Exception:
        # If decryption fails, return None (should not happen in normal operation)
        return None

def encrypt_string(value: str) -> Optional[str]:
    """Encrypt a string value"""
    if value is None:
        return None
    encrypted = _cipher.encrypt(value.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_string(encrypted_value: str) -> Optional[str]:
    """Decrypt an encrypted string"""
    if encrypted_value is None:
        return None
    try:
        decrypted = _cipher.decrypt(encrypted_value.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception:
        return None

