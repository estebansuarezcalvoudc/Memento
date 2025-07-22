
prompt = """
    Analyze this meeting transcript and provide a structured summary with the following:

    1. Meeting Overview
    - Meeting date and duration
    - List of participants (if mentioned)
    - Main objectives discussed

    1. Key Decisions
    - Document all final decisions made
    - Include any deadlines or timelines established
    - Note any budgets or resources allocated

    1. Action Items
    - List each action item with:
        * Assigned owner
        * Due date (if specified)
        * Dependencies or prerequisites
        * Current status (if mentioned)

    1. Discussion Topics
    - Summarize main points for each topic
    - Highlight any challenges or risks identified
    - Note any unresolved questions requiring follow-up

    1. Next Steps
    - Upcoming milestones
    - Scheduled follow-up meetings
    - Required preparations for next discussion

    ROLE: You are a professional meeting analyst focused on extracting actionable
    insights.

    FORMAT: Present the information in clear sections with bullet points for easy
    scanning. Keep descriptions concise but include specific details like names, dates,
    and numbers when mentioned

    If any of these elements are not discussed in the meeting, note their absence rather
    than making assumptions.
""".strip()

