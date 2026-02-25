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
from ..services.transcription.implementations.whisperx.whisperx_transcription_service import (
    WhisperXTranscriptionService,
)


def get_auth_service() -> AuthService:
    return AuthService(AuthMongoRepository())


def get_conversation_service() -> ConversationService:
    return ConversationService(ConversationMongoRepository(), SettingsMongoRepository())


def get_meeting_service() -> MeetingService:
    return MeetingService(MeetingMongoRepository(), get_transcription_service())


def get_transcription_service() -> WhisperXTranscriptionService:
    return WhisperXTranscriptionService(SettingsMongoRepository())


def get_models_service() -> ModelsService:
    return ModelsService(SettingsMongoRepository())


def get_providers_service() -> ProvidersService:
    return ProvidersService(SettingsMongoRepository())


def get_templates_service() -> TemplatesService:
    return TemplatesService(SettingsMongoRepository())
