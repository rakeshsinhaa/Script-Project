import os
import re
import logging
import random
import httpx
from fastapi import FastAPI, HTTPException
from weasyprint import HTML
import tempfile
from fastapi.responses import FileResponse
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
    # Remove any markdown and HTML tags first
    text = re.sub(r'\*\*|__|<[^>]+>', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Bold scene headings (INT./EXT./CUT TO:/FADE OUT:)
    text = re.sub(r'(?<!\*)\b(INT\.|EXT\.|CUT TO:|FADE OUT:)[^\n]+', lambda m: f"**{m.group(0).strip()}**", text)

    # Bold scene numbers (SCENE 1, SCENE 2, etc.)
    text = re.sub(r'(?<=\n)(SCENE\s+\d+)', r'**\1**', text, flags=re.IGNORECASE)

    # Bold character names (usually all caps, 2+ chars)
    text = re.sub(r'(?<=\n)([A-Z][A-Z ]{2,})(?=\n)', r'**\1**', text)

    # Wrap dialogues (lines following bold character names) in <small> tags
    # This will make them appear smaller on the frontend
    text = re.sub(r'\*\*([A-Z][A-Z ]{2,})\*\*\n([^\n]+)', r'**\1**\n<small>\2</small>', text)

    return text.strip()

def extract_scene_descriptions(script: str) -> list:
    scene_pattern = re.compile(r'\*\*(INT\.|EXT\.)[^\*]+\*\*')
    return scene_pattern.findall(script)

async def generate_image(prompt: str, size: str = "1280x720") -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(CLOUDFLARE_URL, json={"prompt": prompt, "size": size})
            response.raise_for_status()
            data = response.json()
            image_data = data.get("image_url", "")
            logger.info(f"Cloudflare response for prompt '{prompt}' with size {size}: {image_data[:100]}...")
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

async def insert_images_into_script(script: str, size: str = "1280x720") -> list:
    # Find all scene headers
    scene_regex = re.compile(r'((?:\*\*)?(?:INT\.|EXT\.|CUT TO:|FADE OUT:)[^\n]*(?:\*\*)?)')
    parts = scene_regex.split(script)[1:]
    
    # Extract all scene headers and their indices
    scene_headers = []
    for i in range(0, len(parts), 2):
        if i < len(parts):
            header = parts[i].strip()
            # Only consider INT. and EXT. scenes for image generation
            if re.search(r'(INT\.|EXT\.)', header):
                scene_headers.append((i, header))
    
    if not scene_headers:
        logger.warning("⚠️ No INT./EXT. scenes found for image generation.")
        # Return script without images
        result = []
        for i in range(0, len(parts), 2):
            header = parts[i].strip()
            text = parts[i + 1].strip() if i + 1 < len(parts) else ""
            result.append({"header": header, "text": text, "image_url": "", "image_prompt": ""})
        return result

    # Select maximum 5 random scenes for image generation
    MAX_IMAGES = 5
    selected_scenes = random.sample(scene_headers, min(MAX_IMAGES, len(scene_headers)))
    selected_indices = {scene[0] for scene in selected_scenes}
    
    logger.info(f"Selected {len(selected_scenes)} scenes for image generation out of {len(scene_headers)} total scenes")
    
    # Process all parts and generate images for selected scenes
    result = []
    images_generated = 0
    
    for i in range(0, len(parts), 2):
        header = parts[i].strip()
        text = parts[i + 1].strip() if i + 1 < len(parts) else ""
        image_url = ""
        image_prompt = ""
        
        # Generate image only if this scene index is selected and we haven't reached the limit
        if i in selected_indices and images_generated < MAX_IMAGES:
            # Clean the header for image prompt
            clean_prompt = re.sub(r'\*\*', '', header).strip()
            logger.info(f"Generating image for scene: {clean_prompt}")
            image_url = await generate_image(clean_prompt, size)
            if image_url:
                image_prompt = clean_prompt
                images_generated += 1
                logger.info(f"Successfully generated image {images_generated}/{MAX_IMAGES}")
            else:
                logger.warning(f"Failed to generate image for scene: {clean_prompt}")
        
        result.append({
            "header": header, 
            "text": text, 
            "image_url": image_url, 
            "image_prompt": image_prompt
        })

    logger.info(f"Final result: Generated {images_generated} images for {len(result)} total scenes")
    return result

def convert_script_to_html(script_data: list) -> str:
    """Converts the script (list of scenes with images/text) into HTML format"""
    html = "<h1 style='text-align:center;'>Movie Script</h1><hr>"
    for scene in script_data:
        html += f"<h2>{scene['header']}</h2>"
        if scene['image_url']:
            html += f"<img src='{scene['image_url']}' style='width:100%; margin:10px 0;'/>"
        html += f"<p>{scene['text'].replace('<small>', '<i>').replace('</small>', '</i>')}</p><hr>"
    return html

def save_script_as_pdf(script_html: str, filename: str = "script.pdf") -> str:
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, filename)

    full_html = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 40px;
                font-size: 14px;
                line-height: 1.6;
            }}
            img {{
                max-width: 100%;
                margin-top: 10px;
                margin-bottom: 10px;
            }}
            h2 {{
                color: #222;
            }}
        </style>
    </head>
    <body>
        {script_html}
    </body>
    </html>
    """

    HTML(string=full_html).write_pdf(file_path)
    return file_path


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
            "Define the scene numbers with scenes (e.g., SCENE 1)"
            "Provide Title for the script in Bold at the top of script before starting "
            "Dialogue must appear under bold character names. Use present tense for descriptions. Keep structure clean and polished:\n"
            f"{data.storyline}"
        )

        response = model.generate_content(prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")
        
        logger.info(f"📝 Raw Gemini script output:\n{response.text}")
        cleaned = clean_script_text(response.text)
        logger.info(f"🧹 Cleaned script:\n{cleaned}")

        script_title = "Script Title"
        match = re.search(r'(Title|Story|Name):? (.+)', data.storyline, re.IGNORECASE)
        if match:
            script_title = match.group(2).strip().title()
        full_script = f"**TITLE: {script_title}**\n\n{cleaned}"

        final_script = await insert_images_into_script(full_script)
        logger.info(f"📜 Final script sent to frontend with {sum(1 for scene in final_script if scene['image_url'])} images")
        return {"script": final_script}

    except Exception as e:
        logger.exception("❌ Error generating script.")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/download-pdf")
async def download_pdf(data: StoryRequest):
    try:
        logger.info(f"📥 PDF download requested for story: {data.storyline[:100]}...")

        # Generate script content
        prompt = (
            "Convert the following story into a fully formatted movie script. "
            "Use left-aligned text only. Bold all scene headings (INT./EXT.), character names, and transitions (e.g., CUT TO:). "
            "Define the scene numbers with scenes (e.g., SCENE 1). "
            "Dialogue must appear under bold character names. Use present tense for descriptions:\n"
            f"{data.storyline}"
        )
        response = model.generate_content(prompt)
        if not response.text:
            raise HTTPException(status_code=500, detail="Model returned no text.")

        cleaned = clean_script_text(response.text)
        script_title = "Script Title"
        match = re.search(r'(Title|Story|Name):? (.+)', data.storyline, re.IGNORECASE)
        if match:
            script_title = match.group(2).strip().title()
        full_script = f"**TITLE: {script_title}**\n\n{cleaned}"

        script_data = await insert_images_into_script(full_script)
        script_html = convert_script_to_html(script_data)
        pdf_path = save_script_as_pdf(script_html)

        logger.info(f"📄 PDF ready: {pdf_path}")
        return FileResponse(pdf_path, media_type="application/pdf", filename="movie_script.pdf")

    except Exception as e:
        logger.exception("❌ Error generating PDF.")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------- Run Server -----------------------
if __name__ == "__main__":
    logger.info("🚀 Launching FastAPI server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)