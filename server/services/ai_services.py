from google.generativeai import configure, GenerativeModel
from dotenv import load_dotenv
import os

load_dotenv()
configure(api_key=os.getenv("GEMINI_API_KEY"))
model = GenerativeModel("gemini-2.0-flash")

def generate_story(prompt: str):
    story_prompt = f"Write a creative short story based on the following idea:\n\n{prompt}"
    response = model.generate_content(story_prompt)
    return response.text

def generate_script(story: str):
    script_prompt = f"Convert the following story into a screenplay script format:\n\n{story}"
    response = model.generate_content(script_prompt)
    return response.text
