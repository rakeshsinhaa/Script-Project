from pydantic import BaseModel

class PromptInput(BaseModel):
    prompt: str

class StoryInput(BaseModel):
    storyline: str
