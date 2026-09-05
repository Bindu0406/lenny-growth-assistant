from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    provider: Optional[str] = "ollama"

class SourceMetadata(BaseModel):
    episode: str
    guest: str
    text: str
    timestamp: Optional[str] = None
    score: float

class SessionCreateResponse(BaseModel):
    session_id: str
    title: str

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True