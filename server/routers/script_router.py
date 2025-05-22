from fastapi import APIRouter
from server.models.story_model import PromptInput, StoryInput
from server.services.ai_services import generate_story, generate_script

router = APIRouter(prefix="/api", tags=["generator"])

@router.post("/generate-story")
def story_endpoint(data: PromptInput):
    story = generate_story(data.prompt)
    return {"story": story}

@router.post("/generate-script")
def script_endpoint(data: StoryInput):
    script = generate_script(data.storyline)
    return {"script": script}
