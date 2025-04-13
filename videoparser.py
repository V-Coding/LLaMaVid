import cv2
from typing import List, Literal, Optional, Sequence
from pathlib import Path
from PIL import Image
import io
import base64
from more_itertools import chunked

def combine_frames_grid(frames: list[Image.Image], size: Optional[tuple[int, int]] = None) -> Image.Image:
    """
    Combines 4 PIL Image frames into a 2x2 grid.
    Optionally resizes all frames to (width, height) before combining.

    Args:
        frames (list): List of 4 PIL Images.
        size (tuple): (width, height) to resize each frame to (optional).

    Returns:
        Image: Combined 2x2 grid image.
    """
    if len(frames) != 4:
        raise ValueError(f"Exactly 4 frames are required to make a 2x2 grid. Received {len(frames)} frames")

    if size:
        frames = [frame.resize(size) for frame in frames]

    w, h = frames[0].size
    grid = Image.new("RGB", (2 * w, 2 * h))

    # Paste each image into the correct quadrant
    grid.paste(frames[0], (0, 0))
    grid.paste(frames[1], (w, 0))
    grid.paste(frames[2], (0, h))
    grid.paste(frames[3], (w, h))

    return grid

class VideoFrameSampler:
    def __init__(self, video_path: str | Path):
        self.video_path = str(video_path)
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise IOError(f"Cannot open video file: {self.video_path}")
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    def sample_multiframe_grid(
        self, 
        sampled_frames,
    ):
        # Step 2: Chunk frames into groups of 4
        grouped_outputs = []
        for group in chunked(sampled_frames, 4):
            if len(group) == 4:
                grid = combine_frames_grid(group)
            else:
                grid = group[0]  # Use single image if < 4 remain

            grouped_outputs.append(grid)
        return grouped_outputs

    def sample_frames(
        self,
        every_n_seconds: float = 1.0,
        output_format: Literal["PIL", "base64"] = "PIL",
        max_frames: int | None = None,
        multiframe: bool = False,
    ) -> Sequence[Image.Image | str]:
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
            frames.append(image)
            count += 1
        
        if multiframe:
            frames = self.sample_multiframe_grid(frames)

        if output_format == "PIL":
            pass
        elif output_format == "base64":
            frames = [self._pil_to_base64(image) for image in frames]
        else:
            raise ValueError(f"Unsupported format: {output_format}")

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