from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from datetime import datetime
import math

from ..schemas.meeting_schema import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
    Link
)

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"]
)

# Mock data for demonstration - in a real app, this would be a database
meetings_db = []
next_id = 1


def generate_meeting_links(meeting_id: int, request: Request) -> List[Link]:
    """Generate HATEOAS links for a meeting"""
    base_url = str(request.base_url).rstrip('/')
    
    links = [
        Link(
            rel="self",
            href=f"{base_url}/meetings/{meeting_id}",
            method="GET"
        ),
        Link(
            rel="update",
            href=f"{base_url}/meetings/{meeting_id}",
            method="PUT"
        ),
        Link(
            rel="delete",
            href=f"{base_url}/meetings/{meeting_id}",
            method="DELETE"
        ),
        Link(
            rel="collection",
            href=f"{base_url}/meetings",
            method="GET"
        )
    ]
    
    return links


def generate_collection_links(request: Request, page: int, page_size: int, total_pages: int) -> List[Link]:
    """Generate HATEOAS links for meeting collection"""
    base_url = str(request.base_url).rstrip('/')
    
    links = [
        Link(
            rel="self",
            href=f"{base_url}/meetings?page={page}&page_size={page_size}",
            method="GET"
        ),
        Link(
            rel="create",
            href=f"{base_url}/meetings",
            method="POST"
        )
    ]
    
    # Add first link if not on first page
    if page > 1:
        links.append(Link(
            rel="first",
            href=f"{base_url}/meetings?page=1&page_size={page_size}",
            method="GET"
        ))
    
    # Add previous link if not on first page
    if page > 1:
        links.append(Link(
            rel="prev",
            href=f"{base_url}/meetings?page={page - 1}&page_size={page_size}",
            method="GET"
        ))
    
    # Add next link if not on last page
    if page < total_pages:
        links.append(Link(
            rel="next",
            href=f"{base_url}/meetings?page={page + 1}&page_size={page_size}",
            method="GET"
        ))
    
    # Add last link if not on last page
    if page < total_pages:
        links.append(Link(
            rel="last",
            href=f"{base_url}/meetings?page={total_pages}&page_size={page_size}",
            method="GET"
        ))
    
    return links


@router.post("/", response_model=MeetingResponse, status_code=201)
async def create_meeting(meeting: MeetingCreate, request: Request):
    """Create a new meeting"""
    global next_id
    
    # Validate meeting times
    if meeting.start_time >= meeting.end_time:
        raise HTTPException(
            status_code=400,
            detail="Meeting start time must be before end time"
        )
    
    # Create new meeting
    new_meeting = {
        "id": next_id,
        "title": meeting.title,
        "description": meeting.description,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "location": meeting.location,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    meetings_db.append(new_meeting)
    meeting_id = next_id
    next_id += 1
    
    # Generate HATEOAS links
    links = generate_meeting_links(meeting_id, request)
    
    response_meeting = MeetingResponse(**new_meeting, links=links)
    return response_meeting


@router.get("/", response_model=MeetingListResponse)
async def get_meetings(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    """Get paginated list of meetings"""
    total = len(meetings_db)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    # Calculate pagination
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_meetings = meetings_db[start_idx:end_idx]
    
    # Generate HATEOAS links for each meeting
    meetings_with_links = []
    for meeting in paginated_meetings:
        links = generate_meeting_links(meeting["id"], request)
        meetings_with_links.append(MeetingResponse(**meeting, links=links))
    
    # Generate collection-level HATEOAS links
    collection_links = generate_collection_links(request, page, page_size, total_pages)
    
    return MeetingListResponse(
        meetings=meetings_with_links,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        links=collection_links
    )


@router.get("/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: int, request: Request):
    """Get a specific meeting by ID"""
    # Find meeting
    meeting = next((m for m in meetings_db if m["id"] == meeting_id), None)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Generate HATEOAS links
    links = generate_meeting_links(meeting_id, request)
    
    return MeetingResponse(**meeting, links=links)


@router.put("/{meeting_id}", response_model=MeetingResponse)
async def update_meeting(meeting_id: int, meeting_update: MeetingUpdate, request: Request):
    """Update a specific meeting"""
    # Find meeting
    meeting_idx = next((i for i, m in enumerate(meetings_db) if m["id"] == meeting_id), None)
    if meeting_idx is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = meetings_db[meeting_idx]
    
    # Update fields that were provided
    update_data = meeting_update.dict(exclude_unset=True)
    
    # Validate meeting times if both are provided or being updated
    start_time = update_data.get("start_time", meeting["start_time"])
    end_time = update_data.get("end_time", meeting["end_time"])
    
    if start_time >= end_time:
        raise HTTPException(
            status_code=400,
            detail="Meeting start time must be before end time"
        )
    
    # Apply updates
    for field, value in update_data.items():
        meeting[field] = value
    
    meeting["updated_at"] = datetime.now()
    meetings_db[meeting_idx] = meeting
    
    # Generate HATEOAS links
    links = generate_meeting_links(meeting_id, request)
    
    return MeetingResponse(**meeting, links=links)


@router.delete("/{meeting_id}", status_code=204)
async def delete_meeting(meeting_id: int):
    """Delete a specific meeting"""
    # Find and remove meeting
    meeting_idx = next((i for i, m in enumerate(meetings_db) if m["id"] == meeting_id), None)
    if meeting_idx is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meetings_db.pop(meeting_idx)
    return JSONResponse(status_code=204, content=None)