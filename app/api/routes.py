from fastapi import APIRouter,HTTPException
from pydantic import BaseModel
import requests
from pytube import YouTube
from yt_dlp import YoutubeDL
from app.services.downloader import get_captions
from app.services.summarizer import generate_summary
from app.services.sentence_transformers import create_embeddings
from app.services.sentence_transformers import get_embeddings
# from sentence_transformers import SentenceTransformer
# from app.db.database import save_video
from app.model.video import VideoRequest,VideoResponse
from app.services.pinecode_db import index
from groq import Groq
from dotenv import load_dotenv
import os
# import chromadb

load_dotenv()
client1 = Groq(
    api_key = os.getenv("GROQ_API_KEY")
)
# client = chromadb.Client()
collection = client.create_collection("youtube-rag")
# model = SentenceTransformer("BAAI/bge-small-en-v1.5")
router = APIRouter()

class QuestionsRequest(BaseModel):
    video_url : str
    query : str

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

        # caption = get_captions(data.url)
        
        chunks,embeddings = create_embeddings(data.url)
        for i,chunk in enumerate(chunks):
            collection.add(documents=[chunk], embeddings=[embeddings[i]], ids=[f"{title}_{i}"])
        
        # chunks = caption.split(".")
        # model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        # embeddings = model.encode(chunks)
        # for i,chunk in enumerate(chunks):
        #     collection.add(documents=[chunk], embeddings=[embeddings[i].tolist()], ids=[str(i)])
        # query=input("Enter a query to fetch ")
        # query_embedding = model.encode(query)
        # results = collection.query(query_embeddings=[query_embedding.tolist()],n_results=3)
        # print(results["documents"])

        #summary = generate_summary(caption)
        
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
            "message" : "Video process successfull.",
            "title" : title
            # "summary" : summary
        }
    except ValueError as e:
        print(f"ValueError: {e}")
        raise HTTPException(status_code=400,detail=str(e))
    except Exception as e:
        print(f"ERROR at: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500,detail=str(e))

@router.post("/ask-question")
async def ask_question(data : QuestionsRequest):
    try:
        chunks,embeddings = create_embeddings(data.video_url)
        for i,chunk in enumerate(chunks):
            # collection.add(documents=[chunk],embeddings=[embeddings[i]],
            # ids=[f"{data.video_url}_{i}"]
            # )
            # above code is used chromadb and using pincone
            index.upsert(
                vectors=[
                    {
                        "id": f"{data.video_url}_{i}",
                        "values": embeddings[i],
                        "metadata": {
                            "text": chunk,
                            "video_url": data.video_url
                        }
                    }
                ]
            )

        query_embedding = get_embeddings(data.query)
        # results = collection.query(
        #     query_embeddings=[query_embedding],n_results=3
        # )
        # replacing this code also
        results = index.query(
            vector=query_embedding,
            top_k=3,
            include_metadata=True
        )
        # documents = results["documents"][0]
        # context = "\n".join(documents)
        matches = results["matches"]
        context="\n".join(match["metadata"]["text"] for match in matches)
        prompt = f"""Answer using this context only
        Context 
        {context}

        Question:
        {data.query}
        """
        response = client1.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role" : "user",
                    "content" : prompt
                }
            ]
        )
        answer = response.choices[0].message.content
        return {
            "query" : data.query,
            "answer" : answer
        }
    except Exception as e:
        return {"error" : str(e)}