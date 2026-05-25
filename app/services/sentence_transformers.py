from sentence_transformers import SentenceTransformer
from app.services.downloader import get_captions

model = SentenceTransformer("BAAI/bge-small-en-v1.5")
def chunk_text(text,chunk_size = 500):
    chunks=[]
    for i in range(0,len(text),chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks

def create_embeddings(video_url:str):
    captions = get_captions(video_url)
    chunks = chunk_text(captions)
    embeddings = model.encode(chunks)
    return chunks,embeddings
