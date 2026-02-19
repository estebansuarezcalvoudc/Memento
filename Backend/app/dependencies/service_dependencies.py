from ..repositories.implementations.mongo.auth_mongo_repo import AuthMongoRepository
from ..repositories.implementations.mongo.conversation_mongo_repo import (
    ConversationMongoRepository,
)
from ..repositories.implementations.mongo.meeting_mongo_repo import (
    MeetingMongoRepository,
)
from ..repositories.implementations.mongo.settings_repo import SettingsMongoRepository
from ..services.auth.auth_service import AuthService
from ..services.conversation.conversation_service import ConversationService
from ..services.meeting.meeting_service import MeetingService
from ..services.settings.models_service import ModelsService
from ..services.settings.providers_service import ProvidersService
from ..services.settings.templates_service import TemplatesService
from ..services.settings.whisperx_service import WhisperXService


def get_auth_service() -> AuthService:
    return AuthService(AuthMongoRepository())


def get_conversation_service() -> ConversationService:
    return ConversationService(ConversationMongoRepository())


def get_meeting_service() -> MeetingService:
    return MeetingService(MeetingMongoRepository())


def get_models_service() -> ModelsService:
    return ModelsService(SettingsMongoRepository())


def get_providers_service() -> ProvidersService:
    return ProvidersService(SettingsMongoRepository())


def get_templates_service() -> TemplatesService:
    return TemplatesService(SettingsMongoRepository())


def get_whisperx_service() -> WhisperXService:
    return WhisperXService(SettingsMongoRepository())
