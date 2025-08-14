import os
import sys
from datetime import datetime, date as date_type
from pathlib import Path

import pymongo
from mcp.server.fastmcp import FastMCP

if __name__ == "__main__":
    backend_path = str(Path(__file__).parents[3])
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

from app.core.settings import settings

mcp = FastMCP("weather")


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
