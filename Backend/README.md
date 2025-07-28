# Meeting Management API with HATEOAS

This FastAPI backend implements HATEOAS (Hypermedia as the Engine of Application State) for a meeting management system.

## Features

- **HATEOAS Implementation**: All API responses include relevant hypermedia links that guide clients through available actions
- **Meeting Management**: Full CRUD operations for meetings
- **Pagination**: Paginated list endpoints with navigation links
- **Data Validation**: Comprehensive input validation using Pydantic
- **OpenAPI Documentation**: Auto-generated API documentation available at `/docs`

## HATEOAS Implementation Details

### Link Schema

Each response includes a `links` array containing hypermedia links with the following structure:

```json
{
  "rel": "self|next|prev|first|last|create|update|delete|collection",
  "href": "http://localhost:8000/api/v1/meetings/1",
  "method": "GET|POST|PUT|DELETE",
  "type": "application/json"
}
```

### Relation Types

- **self**: Link to the current resource
- **next**: Link to the next page (pagination)
- **prev**: Link to the previous page (pagination)
- **first**: Link to the first page (pagination)
- **last**: Link to the last page (pagination)
- **create**: Link to create a new resource
- **update**: Link to update the current resource
- **delete**: Link to delete the current resource
- **collection**: Link to the collection containing the resource

### Example Responses

#### Individual Meeting Response

```json
{
  "title": "Team Standup",
  "description": "Daily team standup meeting",
  "start_time": "2024-07-29T09:00:00",
  "end_time": "2024-07-29T09:30:00",
  "location": "Conference Room A",
  "id": 1,
  "created_at": "2024-07-28T09:45:08.569415",
  "updated_at": "2024-07-28T09:45:08.569418",
  "links": [
    {
      "rel": "self",
      "href": "http://localhost:8000/api/v1/meetings/1",
      "method": "GET",
      "type": "application/json"
    },
    {
      "rel": "update",
      "href": "http://localhost:8000/api/v1/meetings/1",
      "method": "PUT",
      "type": "application/json"
    },
    {
      "rel": "delete",
      "href": "http://localhost:8000/api/v1/meetings/1",
      "method": "DELETE",
      "type": "application/json"
    },
    {
      "rel": "collection",
      "href": "http://localhost:8000/api/v1/meetings",
      "method": "GET",
      "type": "application/json"
    }
  ]
}
```

#### Paginated List Response

```json
{
  "meetings": [...],
  "total": 12,
  "page": 2,
  "page_size": 5,
  "total_pages": 3,
  "links": [
    {
      "rel": "self",
      "href": "http://localhost:8000/api/v1/meetings?page=2&page_size=5",
      "method": "GET",
      "type": "application/json"
    },
    {
      "rel": "create",
      "href": "http://localhost:8000/api/v1/meetings",
      "method": "POST",
      "type": "application/json"
    },
    {
      "rel": "first",
      "href": "http://localhost:8000/api/v1/meetings?page=1&page_size=5",
      "method": "GET",
      "type": "application/json"
    },
    {
      "rel": "prev",
      "href": "http://localhost:8000/api/v1/meetings?page=1&page_size=5",
      "method": "GET",
      "type": "application/json"
    },
    {
      "rel": "next",
      "href": "http://localhost:8000/api/v1/meetings?page=3&page_size=5",
      "method": "GET",
      "type": "application/json"
    },
    {
      "rel": "last",
      "href": "http://localhost:8000/api/v1/meetings?page=3&page_size=5",
      "method": "GET",
      "type": "application/json"
    }
  ]
}
```

## Installation and Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**:
   ```bash
   python run.py
   ```

3. **Access the API**:
   - API Base URL: `http://localhost:8000/api/v1`
   - Interactive Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

## API Endpoints

### Meetings

- `GET /api/v1/meetings` - List all meetings (paginated)
- `POST /api/v1/meetings` - Create a new meeting
- `GET /api/v1/meetings/{id}` - Get a specific meeting
- `PUT /api/v1/meetings/{id}` - Update a specific meeting
- `DELETE /api/v1/meetings/{id}` - Delete a specific meeting

### Query Parameters

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)

## Testing

Run the HATEOAS test suite:

```bash
# Start the server first
python run.py

# In another terminal, run the tests
python test_hateoas.py
```

## Project Structure

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── meeting_schema.py   # Pydantic schemas with Link and Meeting models
│   └── routers/
│       ├── __init__.py
│       └── meeting_router.py   # Meeting endpoints with HATEOAS logic
├── requirements.txt            # Python dependencies
├── run.py                     # Application runner
├── test_hateoas.py           # HATEOAS test suite
└── README.md                 # This file
```

## Key Implementation Details

### Link Generation

The HATEOAS links are dynamically generated based on:

- Current request context (base URL)
- Resource state and relationships
- Available operations for the current user/context
- Pagination state

### Schema Design

- **Link**: Base schema for hypermedia links
- **MeetingResponse**: Individual meeting with embedded links
- **MeetingListResponse**: Paginated collection with navigation links

### Router Logic

The meeting router includes helper functions:

- `generate_meeting_links()`: Creates links for individual meetings
- `generate_collection_links()`: Creates pagination and collection-level links

This design makes the API self-descriptive and allows clients to discover available actions dynamically through the hypermedia links.