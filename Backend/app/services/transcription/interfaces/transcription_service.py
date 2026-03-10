from abc import ABC, abstractmethod

from pydantic import BaseModel

from ....schemas.transcription.transcription_schema import LanguageOption


class TranscriptionResult(BaseModel):
    text: str
    language: str


class TranscriptionService(ABC):
    """Abstract base class for transcription services.

    Encapsulates both the transcription execution and its configuration,
    since both are tightly coupled to the underlying technology.
    Swap the technology by providing a new concrete implementation.
    """

    @abstractmethod
    def transcribe(
        self, audio_bytes: bytes, language: str | None, user_id: str
    ) -> TranscriptionResult:
        """
        Transcribe audio bytes into diarized text.

        Args:
            audio_bytes: Raw audio file bytes
            language: Optional ISO 639-1 language code hint
            user_id: User ID for retrieving user-specific configuration

        Returns:
            TranscriptionResult with diarized text and detected/provided language
        """

    @abstractmethod
    def get_supported_languages(self) -> list[LanguageOption]:
        """
        Get the list of languages supported by this transcription service.

        Returns:
            List of LanguageOption objects sorted alphabetically by name
        """

    @abstractmethod
    def get_available_options(self) -> BaseModel:
        """
        Get the available configuration options for this transcription service
        (e.g. model sizes, compute types).

        Returns:
            Provider-specific Pydantic model with available options
        """

    @abstractmethod
    def get_user_configuration(self, user_id: str) -> BaseModel:
        """
        Get the current transcription configuration for a user.

        Args:
            user_id: User's ID

        Returns:
            Provider-specific Pydantic model with the user's configuration
        """

    @abstractmethod
    def update_user_configuration(self, user_id: str, data: dict) -> BaseModel:
        """
        Partially update the transcription configuration for a user.
        Validation of the data is delegated to the concrete implementation.

        Args:
            user_id: User's ID
            data: Dictionary with the fields to update

        Returns:
            Provider-specific Pydantic model with the updated configuration
        """
