from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VideoRequest(BaseModel):
    url:str

class VideoResponse(BaseModel):
    id : int
    url : str
    title : str
    summary : str
    created_at : datetime