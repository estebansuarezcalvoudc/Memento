import sys
from datetime import date as date_type
from datetime import datetime
from pathlib import Path

import pymongo
from elasticsearch import Elasticsearch
from mcp.server.fastmcp import FastMCP

if __name__ == "__main__":
    backend_path = str(Path(__file__).parents[3])
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

from app.core.logging import setup_logger
from app.core.settings import settings
from app.utils.supported_languages import SUPPORTED_LANGUAGES

mcp = FastMCP("weather")
_logger = setup_logger(__name__)


@mcp.tool()
async def get_current_date() -> str:
    """Get the current date in <YYYY-MM-DD week_day> format (week_day is the day of the week, Friday for instance).


    Returns:
            str: Current date in YYYY-MM-DD format followed by the day of the week
                 (e.g., "2024-01-15 Monday")
    """
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    day_of_week = now.strftime("%A")
    return f"{date_str} {day_of_week}"


@mcp.tool()
async def get_meeting_info_by_date(
    date_str: str, username: str
) -> list[dict[str, str]] | str:
    """
    Retrieves meeting information for a specific date. This tool fetches the meeting
    summaries and transcriptions from the repository for the given date.

    Args:
        date_str (str): The date string in format 'YYYY-MM-DD' for which to retrieve
        meeting information. Use the exact format returned by get_current_date.
        username (str): The username to filter meetings by.

    Returns:
        list[dict[str, str]] | str: A list of dictionaries containing meeting summaries
                                   and transcriptions, or a string message if no meeting
                                   is found. Each dictionary in the list has the
                                   following structure: {
                                       'summary': 'meeting summary text',
                                       'transcription': 'meeting transcription text'
                                   } Multiple meetings can exist for the same date.
    """
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return "Invalid date format. Please use YYYY-MM-DD"

    if not username:
        return "Error: No username provided"

    meeting_repository = MeetingRepository()
    return meeting_repository.retrieve_meeting_summary_and_transcription_by_date(
        date, username
    )


@mcp.tool()
async def get_meetings_by_content(
    query: str, username: str
) -> dict[str, dict[str, str]]:
    """
    Search for meetings by content across summaries and transcriptions using semantic
    search.

    Use this tool when the user asks about:
        - Specific topics, technologies, or subjects discussed in meetings
        - Questions like "which meeting discussed X?", "what was said about Y?"
        - Information about projects, decisions, or technologies mentioned in meetings
        - Any content-based queries that don't specify a particular date

    This tool searches across ALL meetings regardless of date and returns relevant
    matches ranked by relevance score.

    Args:
        query (str): The search query to look for in meeting summaries and
        transcriptions.
                    Use key terms, topics, or phrases the user is asking about.
        username (str): The username to filter meetings by

    Returns:
        dict[str, dict[str, str]]:A dictionary where keys are meeting IDs and values are
                                  dictionaries containing meeting information with keys:
                                  'title', 'date', 'summary', 'transcription',
                                  'language', 'score' Results are ordered by relevance
                                  score (higher is more relevant).
    """
    if not query.strip():
        return {}

    elastic_search = Elasticsearch(
        hosts=[settings.elastic_search_url],
        basic_auth=settings.elastic_search_auth,
        verify_certs=False,
        ssl_show_warn=False,
    )

    all_results = {}

    for language in SUPPORTED_LANGUAGES:
        index_name = f"meetings_{language}"

        try:
            _search_index_for_meetings(
                elastic_search, index_name, language, query, username, all_results
            )
        except Exception as e:
            _logger.error(f"Error searching in index {index_name}: {e}")

    return all_results


def _search_index_for_meetings(
    elastic_search: Elasticsearch,
    index_name: str,
    language: str,
    query: str,
    username: str,
    results_dict: dict[str, dict[str, str]],
) -> None:
    if not elastic_search.indices.exists(index=index_name):
        return

    search_body = _build_search_body(query, username, 100)
    response = elastic_search.search(index=index_name, body=search_body)

    for hit in response["hits"]["hits"]:
        meeting_id = hit["_id"]
        source = hit["_source"]

        results_dict[meeting_id] = {
            "title": source.get("title", ""),
            "date": source.get("date", ""),
            "summary": source.get("summary", ""),
            "transcription": source.get("transcription", ""),
            "language": language,
            "score": str(hit["_score"]),
        }


def _build_search_body(query: str, username: str, size: int) -> dict:
    return {
        "query": {
            "bool": {
                "must": [
                    {"term": {"username": username}},
                    {
                        "multi_match": {
                            "query": query,
                            "fields": [
                                "title^2",
                                "summary^1.5",
                                "transcription",
                            ],
                            "type": "best_fields",
                            "fuzziness": "AUTO",
                        }
                    },
                ]
            }
        },
        "size": size,  # Limit results
        "_source": ["title", "date", "summary", "transcription"],
    }


class MeetingRepository:
    def __init__(self) -> None:
        myclient = pymongo.MongoClient(settings.mongo_url)
        mydb = myclient["meetings_db"]
        self._collection = mydb["meetings"]

    def retrieve_meeting_summary_and_transcription_by_date(
        self, date: date_type, username: str
    ) -> list[dict[str, str]] | str:
        meeting_date = datetime.combine(date, datetime.min.time())

        results = self._collection.find(
            {"username": username, "date": meeting_date},
            {"_id": False, "summary": True, "transcription": True},
        )

        if not results:
            return f"Meeting with date={date}"

        return [
            {"summary": result["summary"], "transcription": result["transcription"]}
            for result in results
        ]


if __name__ == "__main__":
    mcp.run()
