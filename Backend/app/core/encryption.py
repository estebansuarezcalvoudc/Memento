"""Encryption utilities for sensitive data like API keys"""
from cryptography.fernet import Fernet


class EncryptionError(Exception):
    """Raised when encryption/decryption fails"""

    pass


def _get_cipher() -> Fernet:
    """Get Fernet cipher instance from settings"""
    from .settings import settings
    
    encryption_key = settings.encryption_key

    if not encryption_key:
        raise EncryptionError(
            "ENCRYPTION_KEY not found in settings. "
            "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )

    try:
        return Fernet(encryption_key.encode())
    except Exception as e:
        raise EncryptionError(f"Invalid ENCRYPTION_KEY format: {e}") from e


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for secure storage

    Args:
        api_key: Plain text API key

    Returns:
        Encrypted API key as string

    Raises:
        EncryptionError: If encryption fails
    """
    if not api_key:
        raise ValueError("API key cannot be empty")

    try:
        cipher = _get_cipher()
        encrypted_bytes = cipher.encrypt(api_key.encode())
        return encrypted_bytes.decode()
    except Exception as e:
        raise EncryptionError(f"Failed to encrypt API key: {e}") from e


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt an encrypted API key

    Args:
        encrypted_key: Encrypted API key

    Returns:
        Decrypted API key as plain text

    Raises:
        EncryptionError: If decryption fails
    """
    if not encrypted_key:
        raise ValueError("Encrypted key cannot be empty")

    try:
        cipher = _get_cipher()
        decrypted_bytes = cipher.decrypt(encrypted_key.encode())
        return decrypted_bytes.decode()
    except Exception as e:
        raise EncryptionError(f"Failed to decrypt API key: {e}") from e
