from mcp.server.fastmcp import FastMCP
from datetime import date as date_type
import pymongo
from datetime import datetime
import os
import sys

# Add the Backend directory to the Python path when running as standalone
if __name__ == "__main__":
    # Get the Backend directory path
    backend_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

# Try to import settings, handling both standalone and package execution
try:
    from ...core.settings import settings
except ImportError:
    # When running as standalone script
    from app.core.settings import settings

mcp = FastMCP("weather")


@mcp.tool()
async def get_current_date() -> str:
    """Get the current date in YYYY-MM-DD format.

    This tool returns the current date in a standardized format that can be used 
    with other tools that require date parameters.

    Returns:
        str: Current date in YYYY-MM-DD format (e.g., "2025-08-10")
    """
    now = datetime.now()
    return now.strftime('%Y-%m-%d')


@mcp.tool()
async def get_meeting_info_by_date(date_str: str) -> dict[str, str] | str:
    """
    Retrieves meeting information for a specific date. This tool fetches the meeting
    summary and transcription from the repository for the given date.

    Args:
        date_str (str): The date string in format 'YYYY-MM-DD' for which to retrieve
        meeting information.

    Returns:
        dict[str, str] | str: A dictionary containing meeting summary and transcription,
                              or a string message if no meeting is found. The dictionary
                              has the following structure: {
                                  'summary': 'meeting summary text', 'transcription':
                                  'meeting transcription text'
                              }
    """
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return "Invalid date format. Please use YYYY-MM-DD"

    username = os.getenv("MCP_USERNAME", "")
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
    ) -> dict[str, str] | str:
        # Convert date to datetime for MongoDB compatibility
        meeting_date = datetime.combine(date, datetime.min.time())

        result = self._collection.find_one(
            {"username": username, "date": meeting_date},
            {"_id": False, "summary": True, "transcription": True},
        )

        if not result:
            return f"Meeting with date={date} for user={username} not found"

        return {"summary": result["summary"], "transcription": result["transcription"]}


if __name__ == "__main__":
    mcp.run()
