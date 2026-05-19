from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
import requests
from pytube import YouTube
from yt_dlp import YoutubeDL
from app.services.downloader import get_captions
from app.services.summarizer import generate_summary
# from app.db.database import save_video
from app.model.video import VideoRequest,VideoResponse

router = APIRouter()

# class VideoRequest(BaseModel):
#     url:str

# def get_title(url: str) -> str:
#     ydl_opts = {"quiet": True}
#     with YoutubeDL(ydl_opts) as ydl:
#         info = ydl.extract_info(url, download=False)
#         return info["title"]

def get_video_title(url):
    try:
        response = requests.get(
            "https://www.youtube.com/oembed",
            params={"url": url, "format": "json"},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()["title"]
        return "Untitled Video"
    except Exception:
        return "Untitled Video"

@router.post("/process-video")
async def process_video(data: VideoRequest):
    try:
        title = get_video_title(data.url)
        # ydl_opts = {"quiet": True}
        # with YoutubeDL(ydl_opts) as ydl:
        #     info = ydl.extract_info(data.url, download=False)
        #     title = info["title"] 
        # yt = YouTube(data.url)
        caption = get_captions(data.url)
        summary = generate_summary(caption)
        # print(f"Video caption {caption}")
        # print(f"summary {summary}")
        # print("code comes here!!!!")
        # video = await save_video(
        #     url=data.url,
        #     title = title,
        #     summary = summary
        # )
        # return VideoResponse(
        #     id=video["id"],
        #     url=video["url"],
        #     title=video["title"],
        #     summary=video["summary"],
        #     created_at=video["created_at"]
        # )
        return {
            "title" : title,
            "summary" : summary
        }
    except ValueError as e:
        print(f"ValueError: {e}")
        raise HTTPException(status_code=400,detail=str(e))
    except Exception as e:
        print(f"ERROR at: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500,detail=str(e))