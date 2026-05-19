from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound,YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPADATA_API_KEY = os.getenv("SUPADATA_API_KEY")
def get_video_id(url):
    parsed = urlparse(url)
    if parsed.hostname == 'youtu.be':
        return parsed.path[1:]
    return parse_qs(parsed.query).get("v",[None])[0]

def get_captions(url: str) -> str:
    response = requests.get(
        "https://api.supadata.ai/v1/youtube/transcript",
        headers={"x-api-key": SUPADATA_API_KEY},
        params={"url": url, "text": True},
        timeout=30
    )

    if response.status_code != 200:
        raise ValueError(f"Could not fetch transcript: {response.text}")

    data = response.json()
    return data.get("content", "")

# def get_captions(url):
#     try:
#         video_id = get_video_id(url)
#         ytt = YouTubeTranscriptApi()
#         transcript = ytt.fetch(video_id)
#         # transcript = YouTubeTranscriptApi.get_transcript(video_id)
#         return " ".join(chunk.text for chunk in transcript)
#     except TranscriptsDisabled:
#         raise ValueError("This video has caption disabled")
#     except NoTranscriptFound:
#         raise ValueError("No caption found for this video.")