import os
import re
import logging
import random
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google.generativeai import configure, GenerativeModel
import uvicorn

# ----------------------- Logging -----------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ----------------------- Load Env -----------------------
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY", "AIzaSyDIufFKkAqA-0mouVL-UHxZmthNcO5ZHV4")
CLOUDFLARE_URL = os.getenv("CLOUDFLARE_URL", "https://script2screen-image-gen.worldforscience.workers.dev")

if not api_key:
    logger.error("❌ GEMINI_API_KEY not found.")
else:
    logger.info("✅ GEMINI_API_KEY loaded.")

if not CLOUDFLARE_URL:
    logger.error("❌ CLOUDFLARE_URL not found.")
else:
    logger.info("✅ CLOUDFLARE_URL loaded.")

# ----------------------- Configure Gemini -----------------------
try:
    configure(api_key=api_key)
    model = GenerativeModel("gemini-2.0-flash")
    logger.info("✅ Gemini model initialized.")
except Exception as e:
    logger.exception(f"❌ Failed to configure Gemini model: {e}")

# ----------------------- FastAPI Setup -----------------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------- Schemas -----------------------
class PromptRequest(BaseModel):
    prompt: str

class StoryRequest(BaseModel):
    storyline: str

# ----------------------- Utils -----------------------
def clean_script_text(text: str) -> str:
    text = re.sub(r'\*\*|__|<[^>]+>', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_scene_descriptions(script: str) -> list:
    scene_pattern = re.compile(r'\*\*(INT\.|EXT\.)[^\*]+\*\*')
    return scene_pattern.findall(script)

async def generate_image(prompt: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(CLOUDFLARE_URL, json={"prompt": prompt})
            response.raise_for_status()
            data = response.json()
            image_data = data.get("image_url", "")
            logger.info(f"Cloudflare response for prompt '{prompt}': {image_data[:100]}...")  # Log first 100 chars
            if image_data.startswith("data:image"):
                return image_data
            elif image_data:
                return image_data
            else:
                logger.warning("No image data returned from Cloudflare.")
                return ""
    except Exception as e:
        logger.warning(f"⚠️ Image generation failed for prompt '{prompt}': {e}")
        return ""

async def insert_images_into_script(script: str) -> list:
    # Match both bold and plain scene headings
    scene_pattern = re.compile(r'(\*\*(INT\.|EXT\.)[^\n\*]+\*\*|(?<!\*)\b(INT\.|EXT\.)[^\n]+)')
    scenes = scene_pattern.findall(script)
    scene_matches = [match[0] for match in scenes if match[0]]

    if not scene_matches:
        logger.warning("⚠️ No scenes found for image generation.")
        # Split script by headers without images
        scene_regex = re.compile(r'((?:\*\*)?(?:INT\.|EXT\.|CUT TO:|FADE OUT:)[^\n]*(?:\*\*)?)')
        parts = scene_regex.split(script)[1:]  # Skip first empty part
        result = []
        for i in range(0, len(parts), 2):
            header = parts[i].strip()
            text = parts[i + 1].strip() if i + 1 < len(parts) else ""
            result.append({"header": header, "text": text, "image_url": "", "image_prompt": ""})
        return result

    selected = random.sample(scene_matches, min(5, len(scene_matches)))
    scene_regex = re.compile(r'((?:\*\*)?(?:INT\.|EXT\.|CUT TO:|FADE OUT:)[^\n]*(?:\*\*)?)')
    parts = scene_regex.split(script)[1:]  # Skip first empty part
    result = []

    image_index = 0
    for i in range(0, len(parts), 2):
        header = parts[i].strip()
        text = parts[i + 1].strip() if i + 1 < len(parts) else ""
        image_url = ""
        image_prompt = ""
        if header in selected:
            clean_prompt = re.sub(r'\*\*', '', header).strip()
            image_url = await generate_image(clean_prompt)
            image_prompt = clean_prompt if image_url else ""
            image_index += 1
        result.append({"header": header, "text": text, "image_url": image_url, "image_prompt": image_prompt})

    logger.info(f"Final script with images:\n{result[:2]}...")  # Log first two scenes
    return result

# ----------------------- Routes -----------------------
@app.post("/api/generate-story")
async def generate_story(data: PromptRequest):
    try:
        logger.info(f"📩 Received story prompt: {data.prompt[:100]}...")
        response = model.generate_content(data.prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")
        cleaned = clean_script_text(response.text)
        return {"story": cleaned}
    except Exception as e:
        logger.exception("❌ Error generating story.")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-script")
async def generate_script(data: StoryRequest):
    try:
        logger.info(f"🎬 Generating script from story: {data.storyline[:100]}...")

        prompt = (
            "Convert the following story into a fully formatted movie script. "
            "Use left-aligned text only. Bold all scene headings (INT./EXT.), character names, and transitions (e.g., CUT TO:). "
            "Dialogue must appear under bold character names. Use present tense for descriptions. Keep structure clean and polished:\n"
            f"{data.storyline}"
        )

        response = model.generate_content(prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")
        
        logger.info(f"📝 Raw Gemini script output:\n{response.text}")
        cleaned = clean_script_text(response.text)
        logger.info(f"🧹 Cleaned script:\n{cleaned}")

        final_script = await insert_images_into_script(cleaned)
        logger.info(f"📜 Final script sent to frontend:\n{final_script[:2]}...")
        return {"script": final_script}

    except Exception as e:
        logger.exception("❌ Error generating script.")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------- Run Server -----------------------
if __name__ == "__main__":
    logger.info("🚀 Launching FastAPI server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)