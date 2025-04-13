import base64
import os
from pathlib import Path
import tempfile
import time
from typing import Optional, Union
from PIL import Image
from groq import Groq
import re
import json
from groq.types.chat import ChatCompletion
import requests

from more_itertools import chunked

def remove_nonalphanumeric(s: str) -> str:
    return re.sub(r'[^a-zA-Z0-9]', '', s)

def clean_output(output: str):
    return remove_nonalphanumeric(output.strip().lower())

class LlamaPromptTemplates:
    anomaly_detection_prompt_template: str = """You are given an image and a set of rules that define what is considered normal.

Rules:
{input}

Determine if the image shows any **anomaly** that violates the rules above.

Respond with a single word: Yes or No.
Do not include any explanation or additional text.
"""

    obj_detection_prompt_template: str = """Determine if the following object is present in the image:
    {input}

    Respond with a single word: Yes or No.
    Do not include any explanation or additional text.
    """

    image_description_prompt_template: str = """Describe the contents of the image in detail.
Mention any notable objects, actions, people, text, numbers, or scenery.
Use complete sentences and be specific.
"""
    
    event_detection_prompt_template: str = """You are given four consecutive video frames. Determine if the following action/event occurred in these frames:
    {input}

    Respond with a single word: Yes or No.
    Do not include any explanation or additional text.
    """

class GroqBatchManager:
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

    def prepare_jsonl(self, items: list[tuple[str, str]]) -> str:
        fd, path = tempfile.mkstemp(suffix=".jsonl", prefix="groq_batch_", text=True)
        with os.fdopen(fd, "w") as f:
            for prompt, image_url in items:
                line = {
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": image_url}}
                            ]
                        }
                    ]
                }
                f.write(json.dumps(line) + "\n")
        return path

    def upload_batch_file(self, file_path: str) -> str:
        url = "https://api.groq.com/openai/v1/files"
        files = {"file": ("batch_file.jsonl", open(file_path, "rb"))}
        data = {"purpose": "batch"}
        response = requests.post(url, headers=self.headers, files=files, data=data)
        response.raise_for_status()
        return response.json()["id"]

    def submit_batch_job(self, file_id: str) -> str:
        url = "https://api.groq.com/openai/v1/batches"
        body = {
            "input_file_id": file_id,
            "endpoint": "/v1/chat/completions",
            "completion_window": "24h",
            "metadata": {"source": "llama-model-batch"},
            "model": self.model
        }
        response = requests.post(url, headers=self.headers, json=body)
        response.raise_for_status()
        return response.json()["id"]

    def wait_for_completion(self, batch_id: str, poll_interval: float = 2.0):
        url = f"https://api.groq.com/openai/v1/batches/{batch_id}"
        while True:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            status = response.json()
            if status["status"] in {"completed", "failed", "cancelled"}:
                return status
            print(f"  ...batch {batch_id} status: {status['status']}, sleeping {poll_interval}s")
            time.sleep(poll_interval)

    def fetch_results(self, output_file_id: str) -> list[ChatCompletion]:
        url = f"https://api.groq.com/openai/v1/files/{output_file_id}/content"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return [json.loads(line) for line in response.text.strip().splitlines()]

class LlamaModel:
    def __init__(self, api_key: str, model: str = "meta-llama/llama-4-scout-17b-16e-instruct"):
        LLAMA_MODELS: list[str] = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]
        assert model in LLAMA_MODELS, f"{repr(model)} not in {LLAMA_MODELS}"

        self.client = Groq(api_key=api_key)
        self.model = model
    
    def generate(self, prompt: str, image: str):
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
        return response
    
    def batch_generate(self, items: list[tuple[str, str]]) -> list[ChatCompletion]:
        manager = GroqBatchManager(api_key=self.client.api_key, model=self.model)

        print("[1] Creating .jsonl batch file...")
        file_path = manager.prepare_jsonl(items)

        print("[2] Uploading batch file...")
        file_id = manager.upload_batch_file(file_path)

        print("[3] Submitting batch job...")
        batch_id = manager.submit_batch_job(file_id)

        print("[4] Waiting for completion...")
        status = manager.wait_for_completion(batch_id)
        if status["status"] != "completed":
            raise RuntimeError(f"Batch job failed with status: {status['status']}")

        print("[5] Downloading results...")
        return manager.fetch_results(status["output_file_id"])

class LlamaAnomalyDetection(LlamaModel):
    default_prompt_template: str = LlamaPromptTemplates.anomaly_detection_prompt_template

    def __init__(
        self, 
        api_key: str, 
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct", 
        prompt_template: Optional[str] = None
    ):
        super().__init__(api_key, model)

        self.prompt_template = prompt_template if prompt_template else LlamaAnomalyDetection.default_prompt_template
    
    def inference(self, image: str, rules: str) -> str:
        """Send image to Groq's LLaMA model and return a description of what's in the image."""
        prompt = self.prompt_template.format(input=rules) if rules else self.prompt_template

        response = self.generate(prompt, image)
        content = response.choices[0].message.content
        return clean_output(content) if content else ""
    
    def batched_inference(self, images: list[str], rules: str):
        prompt = self.prompt_template.format(input=rules) if rules else self.prompt_template
        batch = [(image, prompt) for image in images]
        output = self.batch_generate(batch)
        content = [response.choices[0].message.content for response in output]
        content = [clean_output(cont) if cont else "" for cont in content]
        return content

class LlamaImageExplainer(LlamaModel):
    default_prompt_template = LlamaPromptTemplates.image_description_prompt_template

    def __init__(
        self, 
        api_key: str, 
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct", 
        prompt_template: Optional[str] = None
    ):
        super().__init__(api_key, model)

        self.prompt_template = prompt_template if prompt_template else LlamaImageExplainer.default_prompt_template
    
    def inference(self, image: str) -> str:
        """Send image to Groq's LLaMA model and return a description of what's in the image."""
        response = self.generate(self.prompt_template, image)
        content = response.choices[0].message.content
        return content if content else ""

class LlamaImageDetector(LlamaModel):
    default_prompt_template: str = LlamaPromptTemplates.obj_detection_prompt_template
    
    def __init__(
        self, 
        api_key: str, 
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct", 
        prompt_template: Optional[str] = None
    ):
        super().__init__(api_key, model)
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
    
    def inference(self, image: str, prompt_parameter: str) -> str:
        """Send image + object description to Groq's LLaMA model and return response text."""
        prompt = self.prompt_template.format(input=prompt_parameter) if prompt_parameter else self.prompt_template
        response = self.generate(prompt, image)
        content = response.choices[0].message.content
        return clean_output(content) if content else ""
    
    def batched_inference(self, images: list[str], prompt_parameter: str) -> list[str]:
        """Send image + object description to Groq's LLaMA model and return response text."""
        prompt = self.prompt_template.format(input=prompt_parameter) if prompt_parameter else self.prompt_template
        batch = [(image, prompt) for image in images]
        output = self.batch_generate(batch)
        content = [response.choices[0].message.content for response in output]
        content = [clean_output(cont) if cont else "" for cont in content]
        return content
