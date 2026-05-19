from youtube_transcript_api import TranscriptsDisabled, NoTranscriptFound,YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs

def get_video_id(url):
    parsed = urlparse(url)
    if parsed.hostname == 'youtu.be':
        return parsed.path[1:]
    return parse_qs(parsed.query).get("v",[None])[0]

def get_captions(url):
    try:
        video_id = get_video_id(url)
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id)
        # transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join(chunk.text for chunk in transcript)
    except TranscriptsDisabled:
        raise ValueError("This video has caption disabled")
    except NoTranscriptFound:
        raise ValueError("No caption found for this video.")