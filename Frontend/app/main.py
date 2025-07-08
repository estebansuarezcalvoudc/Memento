from fastapi import FastAPI
from routers import meeting

app = FastAPI()
app.include_router(meeting.router)