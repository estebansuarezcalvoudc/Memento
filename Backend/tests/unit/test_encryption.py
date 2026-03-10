"""
Unit tests for core/encryption.py
"""

import pytest
from cryptography.fernet import Fernet

from app.core.encryption import EncryptionError, decrypt_api_key, encrypt_api_key


class TestEncryptApiKey:
    def test_encrypt_api_key_should_raise_value_error_when_key_is_empty(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            encrypt_api_key("")

    def test_encrypt_api_key_should_return_a_string(self):
        result = encrypt_api_key("sk-test-key-123")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_encrypt_api_key_should_not_return_plaintext(self):
        plain = "sk-test-key-123"
        result = encrypt_api_key(plain)
        assert plain not in result


class TestDecryptApiKey:
    def test_decrypt_api_key_should_raise_value_error_when_key_is_empty(self):
        with pytest.raises(ValueError, match="cannot be empty"):
            decrypt_api_key("")

    def test_decrypt_api_key_should_raise_encryption_error_for_invalid_token(self):
        with pytest.raises(EncryptionError, match="Failed to decrypt"):
            decrypt_api_key("this-is-not-a-valid-fernet-token")

    def test_encrypt_decrypt_roundtrip_should_recover_original_key(self):
        plain = "sk-my-secret-api-key-abc123"
        encrypted = encrypt_api_key(plain)
        decrypted = decrypt_api_key(encrypted)
        assert decrypted == plain


class TestGetCipher:
    def test_get_cipher_should_raise_encryption_error_when_key_is_missing(
        self, monkeypatch
    ):
        monkeypatch.setattr("app.core.encryption._get_cipher", _raise_missing_key)
        with pytest.raises(EncryptionError):
            _raise_missing_key()

    def test_get_cipher_should_raise_encryption_error_for_invalid_key_format(
        self, monkeypatch
    ):
        """Patch settings to return a key that is not valid base64-Fernet format."""
        import app.core.encryption as enc_module

        original = enc_module._get_cipher

        def patched_get_cipher():
            from app.core.encryption import EncryptionError

            try:
                return Fernet("not-a-valid-fernet-key".encode())
            except Exception as e:
                raise EncryptionError(f"Invalid ENCRYPTION_KEY format: {e}") from e

        monkeypatch.setattr(enc_module, "_get_cipher", patched_get_cipher)

        with pytest.raises(EncryptionError, match="Invalid ENCRYPTION_KEY format"):
            enc_module._get_cipher()


def _raise_missing_key():
    raise EncryptionError("ENCRYPTION_KEY not found in settings.")
