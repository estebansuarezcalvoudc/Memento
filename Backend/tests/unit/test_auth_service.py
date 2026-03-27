from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schemas.auth.auth_schema import UserInDB
from app.services.auth.auth_service import AuthService, pwd_context


def _make_service() -> (
    tuple[AuthService, MagicMock, MagicMock, MagicMock, MagicMock, MagicMock]
):
    auth_repo = MagicMock()
    meeting_repo = MagicMock()
    conversation_repo = MagicMock()
    settings_repo = MagicMock()
    vector_store = MagicMock()

    service = AuthService(
        auth_repo,
        meeting_repo,
        conversation_repo,
        settings_repo,
        vector_store,
    )

    return (
        service,
        auth_repo,
        meeting_repo,
        conversation_repo,
        settings_repo,
        vector_store,
    )


class TestAuthService:
    def test_delete_account_should_mark_account_pending_deletion(self):
        (
            service,
            auth_repo,
            _meeting_repo,
            _conversation_repo,
            _settings_repo,
            _vector_store,
        ) = _make_service()
        hashed = pwd_context.hash("password123")
        auth_repo.retrieve_user_by_id.return_value = UserInDB(
            id="507f191e810c19729de860ea",
            username="test@example.com",
            password=hashed,
            status="active",
            scheduled_purge_at=None,
        )

        before = datetime.now(timezone.utc)
        service.delete_account("507f191e810c19729de860ea", "password123")
        after = datetime.now(timezone.utc)

        auth_repo.mark_account_pending_deletion.assert_called_once()
        called_user_id, called_purge_at = (
            auth_repo.mark_account_pending_deletion.call_args.args
        )
        assert called_user_id == "507f191e810c19729de860ea"

        expected_min = before + timedelta(days=30)
        expected_max = after + timedelta(days=30)
        assert expected_min <= called_purge_at <= expected_max

    def test_delete_account_should_fail_when_already_pending_deletion(self):
        (
            service,
            auth_repo,
            _meeting_repo,
            _conversation_repo,
            _settings_repo,
            _vector_store,
        ) = _make_service()
        hashed = pwd_context.hash("password123")
        auth_repo.retrieve_user_by_id.return_value = UserInDB(
            id="507f191e810c19729de860ea",
            username="test@example.com",
            password=hashed,
            status="pending_deletion",
            scheduled_purge_at=datetime.now(timezone.utc),
        )

        with pytest.raises(HTTPException) as exc_info:
            service.delete_account("507f191e810c19729de860ea", "password123")

        assert exc_info.value.status_code == 409
        auth_repo.mark_account_pending_deletion.assert_not_called()

    def test_purge_accounts_due_for_deletion_should_delete_all_user_data(self):
        (
            service,
            auth_repo,
            meeting_repo,
            conversation_repo,
            settings_repo,
            vector_store,
        ) = _make_service()

        auth_repo.list_accounts_pending_purge.return_value = [
            UserInDB(
                id="507f191e810c19729de860ea",
                username="one@example.com",
                password="irrelevant",
                status="pending_deletion",
                scheduled_purge_at=datetime.now(timezone.utc),
            ),
            UserInDB(
                id="507f191e810c19729de860eb",
                username="two@example.com",
                password="irrelevant",
                status="pending_deletion",
                scheduled_purge_at=datetime.now(timezone.utc),
            ),
        ]

        service.purge_accounts_due_for_deletion()

        assert meeting_repo.delete_user_data.call_count == 2
        assert conversation_repo.delete_user_data.call_count == 2
        assert settings_repo.delete_user_data.call_count == 2
        assert vector_store.delete.call_count == 2
        assert auth_repo.delete_account.call_count == 2
