from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class Link(BaseModel):
    """Schema for HATEOAS links"""
    rel: str = Field(..., description="Relationship type (self, next, prev, etc.)")
    href: str = Field(..., description="URL for the link")
    method: str = Field(default="GET", description="HTTP method for the link")
    type: str = Field(default="application/json", description="Media type")


class MeetingBase(BaseModel):
    """Base meeting schema"""
    title: str = Field(..., min_length=1, max_length=200, description="Meeting title")
    description: Optional[str] = Field(None, max_length=1000, description="Meeting description")
    start_time: datetime = Field(..., description="Meeting start time")
    end_time: datetime = Field(..., description="Meeting end time")
    location: Optional[str] = Field(None, max_length=200, description="Meeting location")


class MeetingCreate(MeetingBase):
    """Schema for creating a meeting"""
    pass


class MeetingUpdate(BaseModel):
    """Schema for updating a meeting"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)


class MeetingResponse(MeetingBase):
    """Schema for meeting response with HATEOAS links"""
    id: int = Field(..., description="Meeting ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    links: List[Link] = Field(default_factory=list, description="HATEOAS links")

    class Config:
        from_attributes = True


class MeetingListResponse(BaseModel):
    """Schema for paginated meeting list response with HATEOAS links"""
    meetings: List[MeetingResponse] = Field(..., description="List of meetings")
    total: int = Field(..., description="Total number of meetings")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    links: List[Link] = Field(default_factory=list, description="HATEOAS navigation links")