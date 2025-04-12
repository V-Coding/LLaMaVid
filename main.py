import os
from dotenv import load_dotenv
load_dotenv()
from videoparser import VideoFrameSampler
from llm import LLamaImageExplainer, LlamaImageDetector, LlamaPromptTemplates

GROQ_API_KEY = os.environ["GROQ_API_KEY"]

def detect_object_in_video(
    video_path: str,
    object_description: str,
    every_n_seconds: float = 2.0,
    max_frames: int = 20,
    model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
):
    sampler = VideoFrameSampler(video_path)
    interpreter = LlamaImageDetector(GROQ_API_KEY, model=model)
    # explainer = LLamaImageExplainer(GROQ_API_KEY, model=model)

    fps = sampler.fps
    interval = int(fps * every_n_seconds)

    frames_base64 = sampler.sample_frames(
        every_n_seconds=every_n_seconds,
        output_format="base64",
        max_frames=max_frames
    )

    matched_timestamps = []
    for i, frame_base64 in enumerate(frames_base64):
        timestamp_sec = round(i * every_n_seconds, 2)
        image = f"data:image/jpeg;base64,{frame_base64}"
        try:
            reply = interpreter.interpret(image, object_description)
            if reply.lower() == "yes":
                matched_timestamps.append(timestamp_sec)
                print(f"[✓] Object detected at {timestamp_sec} sec")
            elif reply == "no":
                print(f"[ ] No object at {timestamp_sec} sec")
                # explanation = explainer.explain(image)
                # print(f"EXPLANATION: {explanation}")
            else:
                print(f"RESPONSE ({timestamp_sec} sec): {reply}")
        except Exception as e:
            print(f"[!] Error at frame {i} ({timestamp_sec}s): {e}")

    return matched_timestamps



if __name__ ==  "__main__":
    detected_timestamps = detect_object_in_video(
        video_path="sample_data/IMG_5361.MOV",
        object_description="extension cord",
        every_n_seconds=1,
        max_frames=20,
    )

    print(detected_timestamps)