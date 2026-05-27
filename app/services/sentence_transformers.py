from app.services.downloader import get_captions
import os
import requests
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
API_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5"
headers = {
    "Authorization": f"Bearer {HF_TOKEN}"}

def chunk_text(text,chunk_size = 500):
    chunks=[]
    for i in range(0,len(text),chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks

def get_embeddings(text):
    try:
        response=requests.post(
            API_URL,
            headers = headers,
            json={"inputs" : text},
            timeout = 70
        )
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        raise Exception(f"HuggingFace API Error: {str(e)}")

def create_embeddings(video_url:str):
    captions = get_captions(video_url)
    chunks = chunk_text(captions)
    embeddings = []
    for chunk in chunks:
        embedding = get_embeddings(chunk)
        embeddings.append(embedding)
    return chunks,embeddings
