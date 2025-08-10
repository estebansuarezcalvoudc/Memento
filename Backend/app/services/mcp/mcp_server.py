from mcp.server.fastmcp import FastMCP
from datetime import datetime

mcp = FastMCP("weather")


@mcp.tool()
async def get_current_date() -> str:
    """Get the current date formatted as a string.

    This tools returns the curren date, which can be used to infer other dates, like, a
    week ago, a month ago or yesterday.

    Returns:
        str: A formatted string containing:
            - Week day
            - Day of month
            - Month name
            - Year
    """
    now = datetime.now()
    return f"""
        Week day: {now.strftime('%A')}
        Day month number: {now.strftime('%d')}
        Month: {now.strftime('%B')}
        year: {now.strftime('%Y')}
    """


if __name__ == "__main__":
    mcp.run()
