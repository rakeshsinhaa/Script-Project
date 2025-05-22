from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.generativeai import configure, GenerativeModel
from dotenv import load_dotenv
import os
import uvicorn

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
        return {"story": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Script generation endpoint
@app.post("/api/generate-script")
async def generate_script(data: StoryRequest):
    try:
        prompt = (
            "Convert this short story into a movie screenplay format with scenes, actions, and dialogues:\n"
            f"{data.storyline}"
        )
        response = model.generate_content(prompt)
        return {"script": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Uvicorn dev server entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
