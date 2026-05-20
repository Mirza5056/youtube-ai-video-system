import requests
import os
from dotenv import load_dotenv

load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")
API_KEY = os.getenv("API_KEY")
def generate_summary(caption: str) -> str:
    caption = caption[:1500]
    # prompt = f"Summarize the following text in 3 clear bullet points:\n\n{caption}\n\nSummary:"
    prompt = f"""Create a professional summary of this YouTube video transcript.
    Include:
    - Brief overview
    - 3 key insights in bullet points
    - Final conclusion
    Transcript:
    {caption}
    Summary:
    """
    for attemp in range(3):
        response = requests.post(
            API_KEY,
            headers={"Authorization": f"Bearer {HF_TOKEN}"},
            json={
                "inputs": caption,
                "parameters": {
                    "max_length": 150,
                    "min_length": 50,
                    "do_sample": False
                }
            },
            timeout=70
        )
        if response.status_code == 503:
            print("Model loading, retrying in 15s...")
            time.sleep(15)
            continue
        if response.status_code == 401:
            raise ValueError("Invalid HF token. Check your HF_TOKEN.")
        if response.status_code != 200:
            raise ValueError(f"HF API returned {response.status_code}: {response.text}")
        result = response.json()
        if isinstance(result, dict) and "error" in result:
            raise ValueError(f"HF API error: {result['error']}")

        return result[0]["summary_text"]
    raise ValueError("Model take much longer time to responed.")