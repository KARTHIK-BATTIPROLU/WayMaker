from pydantic import BaseModel, Field
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=4000)

class ChatMessageOut(BaseModel):
    id: str
    projectId: str
    role: str
    content: str
    timestamp: datetime
