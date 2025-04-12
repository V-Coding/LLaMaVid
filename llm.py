import base64
from pathlib import Path
from typing import Optional, Union

from groq import Groq
import re

def remove_nonalphanumeric(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', s)

class LlamaPromptTemplates:
    obj_detection_prompt_template: str = """Determine if the following object is present in the image:
    {object_description}

    Respond with a single word: Yes or No.
    Do not include any explanation or additional text.
    """

    scene_description_prompt_template: str = """Describe the contents of the image in detail.
Mention any notable objects, actions, people, text, numbers, or scenery.
Use complete sentences and be specific.
"""

class LLamaImageExplainer:
    default_prompt_template: str = """Describe the contents of the image in detail.
Mention any notable objects, actions, people, text, numbers, or scenery.
Use complete sentences and be specific.
"""

    def __init__(
        self, 
        api_key: str, 
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct", 
        prompt_template: Optional[str] = None
    ):
        LLAMA_MODELS: list[str] = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]
        assert model in LLAMA_MODELS, f"{repr(model)} not in {LLAMA_MODELS}"
        
        self.client = Groq(api_key=api_key)
        self.model = model
        self.prompt_template = prompt_template if prompt_template else LLamaImageExplainer.default_prompt_template
    
    def explain(self, image: str) -> str:
        """Send image + object description to Groq's LLaMA model and return response text."""
        response = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": self.prompt_template},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image
                            },
                        },
                    ],
                }
            ],
            model=self.model,
        )
        content = response.choices[0].message.content
        return content if content else ""

class LlamaImageDetector:
    default_prompt_template: str = """Determine if the following object is present in the image:
    {object_description}

    Respond with a single word: Yes or No.
    Do not include any explanation or additional text.
    """
    def __init__(
        self, 
        api_key: str, 
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct", 
        prompt_template: Optional[str] = None
    ):
        LLAMA_MODELS: list[str] = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]
        assert model in LLAMA_MODELS, f"{repr(model)} not in {LLAMA_MODELS}"
        
        self.client = Groq(api_key=api_key)
        self.model = model
        self.prompt_template = prompt_template if prompt_template else LlamaImageDetector.default_prompt_template

    @staticmethod
    def image_to_base64(image: Union[str, Path, bytes]) -> str:
        """Convert image file or bytes to base64-encoded string."""
        if isinstance(image, (str, Path)):
            with open(image, "rb") as f:
                image_bytes = f.read()
        elif isinstance(image, bytes):
            image_bytes = image
        else:
            raise TypeError("Image must be a file path or bytes.")
        return base64.b64encode(image_bytes).decode("utf-8")
    
    def clean_output(self, output: str):
        return remove_nonalphanumeric(output.strip().lower())

    def interpret(self, image: str, object_description: str) -> str:
        """Send image + object description to Groq's LLaMA model and return response text."""
        prompt = self.prompt_template.format(object_description=object_description) if object_description else self.prompt_template
        response = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image
                            },
                        },
                    ],
                }
            ],
            model=self.model,
        )
        content = response.choices[0].message.content
        return self.clean_output(content) if content else ""
