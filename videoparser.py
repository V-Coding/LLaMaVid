import cv2
from typing import List, Literal
from pathlib import Path
from PIL import Image
import io
import base64


class VideoFrameSampler:
    def __init__(self, video_path: str | Path):
        self.video_path = str(video_path)
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise IOError(f"Cannot open video file: {self.video_path}")
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

    def sample_frames(
        self,
        every_n_seconds: float = 1.0,
        output_format: Literal["PIL", "base64"] = "PIL",
        max_frames: int | None = None,
    ) -> List[Image.Image | str]:
        interval = int(self.fps * every_n_seconds)
        frames = []
        count = 0

        for frame_idx in range(0, self.total_frames, interval):
            if max_frames is not None and count >= max_frames:
                break

            self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = self.cap.read()
            if not ret:
                break
            image = self._cv2_to_pil(frame)
            if output_format == "PIL":
                frames.append(image)
            elif output_format == "base64":
                frames.append(self._pil_to_base64(image))
            else:
                raise ValueError(f"Unsupported format: {output_format}")
            count += 1

        self.cap.release()
        return frames

    @staticmethod
    def _cv2_to_pil(frame_bgr) -> Image.Image:
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        return Image.fromarray(frame_rgb)

    @staticmethod
    def _pil_to_base64(image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")