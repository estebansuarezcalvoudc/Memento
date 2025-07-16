"""
YAML documentation loader for meeting router endpoints.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

import yaml


@dataclass(frozen=True)
class CreateMeetingsEndpointDocs:
    """Documentation for the create_meetings endpoint."""

    description: str
    openapi_extra: Dict[str, Any]
    meetings_metadata_form_description: str
    meetings_metadata_form_example: str
    audios_file_description: str

    @classmethod
    def load_from_yaml(cls, yaml_path: Path) -> "CreateMeetingsEndpointDocs":
        """Load documentation from YAML file."""
        with open(yaml_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = yaml.safe_load(f)

        return cls(
            description=data["endpoint_descriptions"]["create_meetings"],
            openapi_extra=data["openapi_schemas"]["create_meetings"],
            meetings_metadata_form_description=data["form_descriptions"][
                "meetings_metadata"
            ],
            meetings_metadata_form_example=data["form_examples"]["meetings_metadata"],
            audios_file_description=data["form_descriptions"]["audios"],
        )


_docs_path = Path(__file__).parent / "meeting_docs.yaml"
create_meetings_docs = CreateMeetingsEndpointDocs.load_from_yaml(_docs_path)
