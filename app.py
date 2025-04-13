import os
import tempfile
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from main import detection_in_video, detection_in_video_batched

load_dotenv()
GROQ_API_KEY = os.environ["GROQ_API_KEY"]

app = Flask(__name__)


@app.route("/detect", methods=["POST"])
def detect():
    if "video" not in request.files or "description" not in request.form:
        return jsonify({"error": "Missing video or description"}), 400

    video_file = request.files["video"]
    description = request.form["description"]

    if video_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        every_n_seconds = float(request.form.get("every_n_seconds", 2.0))
        max_frames = int(request.form.get("max_frames", 20))
    except ValueError:
        return jsonify({"error": "Invalid number format for 'every_n_seconds' or 'max_frames'"}), 400

    try:
        # Securely save the uploaded video temporarily
        if video_file.filename is None:
            raise Exception("Video filename is none")
        filename = secure_filename(video_file.filename)
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = os.path.join(tmpdir, filename)
            video_file.save(filepath)

            timestamps = detection_in_video(
                video_path=filepath,
                prompt_input=description,
                method="detection",
                every_n_seconds=every_n_seconds,
                max_frames=max_frames,
            )

            return jsonify({"timestamps": timestamps})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
