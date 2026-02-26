from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, ValidationInfo, field_validator


class ProviderType(str, Enum):
    OPENAI = "OpenAI"
    OLLAMA = "Ollama"


class LanguageModelConfiguration(BaseModel):
    provider: ProviderType = Field(
        default=ProviderType.OPENAI,
        description="The provider to use for the language model",
    )
    model: str = Field(
        default="gpt-4o-mini",
        description="The specific model to use for generating responses",
    )
    options: dict[str, Any] = Field(
        default={"temperature": 0.2, "max_tokens": 2000},
        description="Options for the language model (e.g., temperature, max_completion_tokens)",
    )

    @field_validator("options")
    @classmethod
    def validate_options(
        cls, options: Optional[dict[str, Any]], info: ValidationInfo
    ) -> Optional[dict[str, Any]]:
        """Validate language model options against OpenAI API parameters."""
        if options is None:
            return options

        valid_openai_params = {
            "temperature",
            "max_tokens",
            "max_completion_tokens",
            "top_p",
            "frequency_penalty",
            "presence_penalty",
            "stop",
            "seed",
            "response_format",
            "stream",
            "logit_bias",
            "logprobs",
            "top_logprobs",
            "n",
            "timeout",
            "user",
            "extra_headers",
            "extra_query",
            "extra_body",
            "parallel_tool_calls",
        }

        invalid_params = set(options.keys()) - valid_openai_params
        if invalid_params:
            raise ValueError(
                f"Invalid OpenAI parameters: {invalid_params}. "
                f"Valid parameters: {sorted(valid_openai_params)}"
            )

        if "temperature" in options:
            temp = options["temperature"]
            if not isinstance(temp, (int, float)) or not 0 <= temp <= 2:
                raise ValueError("temperature must be a number between 0 and 2")

        if "top_p" in options:
            top_p = options["top_p"]
            if not isinstance(top_p, (int, float)) or not 0 <= top_p <= 1:
                raise ValueError("top_p must be a number between 0 and 1")

        if "frequency_penalty" in options:
            fp = options["frequency_penalty"]
            if not isinstance(fp, (int, float)) or not -2 <= fp <= 2:
                raise ValueError("frequency_penalty must be a number between -2 and 2")

        if "presence_penalty" in options:
            pp = options["presence_penalty"]
            if not isinstance(pp, (int, float)) or not -2 <= pp <= 2:
                raise ValueError("presence_penalty must be a number between -2 and 2")

        if "max_tokens" in options:
            max_tokens = options["max_tokens"]
            if not isinstance(max_tokens, int) or max_tokens <= 0:
                raise ValueError("max_tokens must be a positive integer")

        if "max_completion_tokens" in options:
            max_completion_tokens = options["max_completion_tokens"]
            if not isinstance(max_completion_tokens, int) or max_completion_tokens <= 0:
                raise ValueError("max_completion_tokens must be a positive integer")

        if "n" in options:
            n = options["n"]
            if not isinstance(n, int) or n <= 0:
                raise ValueError("n must be a positive integer")

        return options

    @field_validator("model")
    @classmethod
    def validate_model(cls, model: str, info: ValidationInfo) -> str:
        """Validate model name."""
        if not model or not isinstance(model, str):
            raise ValueError("Model name must be a non-empty string")

        if not model.strip():
            raise ValueError("Model name cannot be empty")

        return model.strip()
