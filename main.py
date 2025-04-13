from audioop import mul
import os
from typing import Literal
from cv2.gapi.streaming import timestamp
from dotenv import load_dotenv
from more_itertools import chunked
from videoparser import VideoFrameSampler
from llm import LlamaAnomalyDetection, LlamaImageExplainer, LlamaImageDetector, LlamaPromptTemplates
from groq import Groq
import os
import sys
from moviepy import VideoFileClip



load_dotenv()
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

def detection_in_video(
    video_path: str,
    prompt_input: str,
    method: Literal["detection", "anomaly"] = "detection",
    every_n_seconds: float = 2.0,
    max_frames: int = 20,
    model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
    multiframe: bool = False,
):
    sampler = VideoFrameSampler(video_path)
    if method == "detection":
        llm = LlamaImageDetector(GROQ_API_KEY, model=model)
    elif method == "anomaly":
        llm = LlamaAnomalyDetection(GROQ_API_KEY, model=model)
    else:
        raise ValueError("method must be 'detection' or 'anomaly'")
    # explainer = LLamaImageExplainer(GROQ_API_KEY, model=model)

    frames_base64 = sampler.sample_frames(
        every_n_seconds=every_n_seconds,
        output_format="base64",
        max_frames=max_frames,
        multiframe=multiframe,
    )

    matched_timestamps = []
    timestamps = [round(i * every_n_seconds * 4 if multiframe else i * every_n_seconds, 5) for i in range(len(frames_base64))]
    for i, frame_base64 in enumerate(frames_base64):
        timestamp_sec = timestamps[i]
        image = f"data:image/jpeg;base64,{frame_base64}"
        try:
            reply = llm.inference(image, prompt_input)
            if reply.lower() == "yes":
                matched_timestamps.append(timestamp_sec)
                if multiframe:
                    print(f"[✓] Object detected at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
                else:
                    print(f"[✓] Object detected at {timestamp_sec} sec")
            elif reply == "no":
                if multiframe:
                    print(f"[ ] No object at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
                else:
                    print(f"[ ] No object at {timestamp_sec} sec")

                # explanation = explainer.explain(image)
                # print(f"EXPLANATION: {explanation}")
            else:
                print(f"RESPONSE ({timestamp_sec} sec): {reply}")
        except Exception as e:
            if multiframe:
                print(f"[!] Error at frame {i} ({timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec): {e}")
            else:
                print(f"[!] Error at frame {i} ({timestamp_sec} sec): {e}")


    return matched_timestamps

def detection_in_video_batched(
        video_path: str,
        prompt_input: str,
        method: Literal["detection", "anomaly"] = "detection",
        every_n_seconds: float = 2.0,
        max_frames: int = 20,
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
        multiframe: bool = False,
        batch_size: int = 4,
    ):
    sampler = VideoFrameSampler(video_path)
    if method == "detection":
        llm = LlamaImageDetector(GROQ_API_KEY, model=model)
    elif method == "anomaly":
        llm = LlamaAnomalyDetection(GROQ_API_KEY, model=model)
    else:
        raise ValueError("method must be 'detection' or 'anomaly'")

    # explainer = LLamaImageExplainer(GROQ_API_KEY, model=model)

    frames_base64 = sampler.sample_frames(
        every_n_seconds=every_n_seconds,
        output_format="base64",
        max_frames=max_frames,
        multiframe=multiframe,
    )

    matched_timestamps = []
    timestamps = [round(i * every_n_seconds * 4 if multiframe else i * every_n_seconds, 5) for i in range(len(frames_base64))]
    for i, (batch_frames_base64, batch_timestamps) in enumerate(zip(chunked(frames_base64, batch_size), chunked(timestamps, batch_size))):
        images = [f"data:image/jpeg;base64,{frame_base64}" for frame_base64 in batch_frames_base64]
        try:
            replies = llm.batched_inference(images, prompt_input)
            for reply, timestamp_sec in zip(replies, batch_timestamps):
                if reply.lower() == "yes":
                    matched_timestamps.append(timestamp_sec)
                    if multiframe:
                        print(f"[✓] Object/Anomaly detected at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
                    else:
                        print(f"[✓] Object/Anomaly detected at {timestamp_sec} sec")
                elif reply == "no":
                    if multiframe:
                        print(f"[ ] No Object/Anomaly at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
                    else:
                        print(f"[ ] No Object/Anomaly at {timestamp_sec} sec")
                else:
                    print(f"RESPONSE ({timestamp_sec} sec): {reply}")
        except Exception as e:
            print(f"[!] Error at frame {i} ({batch_timestamps[0]} sec): {e}")
        
    return matched_timestamps



def detect_event_in_video(
        video_path: str,
        event_description: str,
        every_n_seconds: float = 2.0,
        max_frames: int = 20,
        model: str = "meta-llama/llama-4-scout-17b-16e-instruct",
    ):
    multiframe: bool = True
    sampler = VideoFrameSampler(video_path)
    interpreter = LlamaImageDetector(
        GROQ_API_KEY, 
        model=model, 
        prompt_template=LlamaPromptTemplates.event_detection_prompt_template
    )
    # explainer = LLamaImageExplainer(GROQ_API_KEY, model=model)

    frames_base64 = sampler.sample_frames(
        every_n_seconds=every_n_seconds,
        output_format="base64",
        max_frames=max_frames,
        multiframe=multiframe,
    )

    matched_timestamps = []
    for i, frame_base64 in enumerate(frames_base64):
        timestamp_sec = i * every_n_seconds * 4 if multiframe else i * every_n_seconds
        timestamp_sec = round(timestamp_sec, 5)
        image = f"data:image/jpeg;base64,{frame_base64}"
        try:
            reply = interpreter.inference(image, event_description)
            if reply.lower() == "yes":
                matched_timestamps.append(timestamp_sec)
                print(f"[✓] Event detected at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
            elif reply == "no":
                print(f"[ ] No event at {timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec")
                # explanation = explainer.explain(image)
                # print(f"EXPLANATION: {explanation}")
            else:
                print(f"RESPONSE ({timestamp_sec}-{timestamp_sec+every_n_seconds*4} sec): {reply}")
        except Exception as e:
            print(f"[!] Error at frame {i} ({timestamp_sec}-{timestamp_sec+every_n_seconds*4}s): {e}")

    return matched_timestamps


def transcribe_audio(filename):
    audio_path = convert_video_to_audio_moviepy(filename)
    client = Groq(api_key=GROQ_API_KEY)

    with open(audio_path, "rb") as file:
        transcription = client.audio.transcriptions.create(

        file=(audio_path, file.read()),

        model="whisper-large-v3",
        prompt='Make sure to transcribe any sound effects in the background of the audio, to make it accessible for deaf audiences.',

        response_format="verbose_json",  # Optional
        

        timestamp_granularities = ["segment"],
        language="en",  # Optional

        temperature=0.0  # Optional

        )

        for segment in transcription.segments:
            print(segment['start'], "-", segment['end'], ': ')
            print(segment['text'])
        return transcription.segments

def convert_video_to_audio_moviepy(video_file, output_ext="mp3"):
    """Converts video to audio using MoviePy library
    that uses `ffmpeg` under the hood"""
    filename, ext = os.path.splitext(video_file)
    clip = VideoFileClip(video_file)
    if clip.audio: 
        clip.audio.write_audiofile(f"{filename}.{output_ext}")
    else:
        raise Exception(f"clip.audio is None. {clip.audio}")
    
    return (f"{filename}.{output_ext}")
if __name__ ==  "__main__":
    detected_timestamps = detection_in_video(
        video_path="sample_data/IMG_5362.MOV",
        prompt_input="""
        There must be someone wearing a bandana.
        """,
        method="anomaly",
        every_n_seconds=1,
        max_frames=40,
    )
    # transcribe_audio('sample_data/IMG_5362.MOV')
    print(detected_timestamps)
    