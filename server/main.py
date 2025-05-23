from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.generativeai import configure, GenerativeModel
from dotenv import load_dotenv
import os
import uvicorn
import re

# Load environment variables
load_dotenv()

# Configure Gemini API
configure(api_key=os.getenv("GEMINI_API_KEY"))
model = GenerativeModel("gemini-2.0-flash")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS (dev setting, restrict in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_script_text(text: str) -> str:
    # Remove Markdown bold/italic and HTML tags
    text = re.sub(r'\*\*|__|<[^>]+>', '', text)

    # Normalize multiple empty lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Trim leading/trailing whitespace
    return text.strip()


# Request schemas
class PromptRequest(BaseModel):
    prompt: str

class StoryRequest(BaseModel):
    storyline: str

# Story generation endpoint
@app.post("/api/generate-story")
async def generate_story(data: PromptRequest):
    try:
        response = model.generate_content(data.prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")
        cleaned = clean_script_text(response.text)
        return {"story": cleaned}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Script generation endpoint
@app.post("/api/generate-script")
async def generate_script(data: StoryRequest):
    try:
        prompt = (
            "Please convert the following story into a fully formatted movie script. The entire script should be left-aligned, with no centered text. Apply bold formatting to all scene headings (such as INT. or EXT.), character names, and transition cues like CUT TO:. Dialogue should appear directly under the bold character name, and everything must remain left-aligned. Use present tense for action and scene descriptions. Organize the script into clearly divided scenes with realistic pacing and natural dialogue. Make sure the script feels polished and complete. Do not include any follow-up questions, suggestions for continuation, or prompts at the end:\n"
            f"{data.storyline}"
        )
        response = model.generate_content(prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")

        cleaned = clean_script_text(response.text)
        return {"script": cleaned}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Uvicorn dev server entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
