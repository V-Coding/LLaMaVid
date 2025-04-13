interface UploadResponse {
    timestamps: number[]
}

const uploadVideo = async (videoFile: File, description: string, everyNSeconds = 1.0, maxFrames = 20): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("description", description);
    formData.append("every_n_seconds", everyNSeconds.toString());
    formData.append("max_frames", maxFrames.toString());

    try {
        const response = await fetch("http://localhost:5000/detect", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error:", errorData.error);
            return {
                timestamps: []
            };
        }

        const data: UploadResponse = await response.json();
        console.log("Detection timestamps:", data.timestamps);
        return data;
    } catch (error) {
        console.error("Request failed:", error);
        return {
            timestamps: []
        };
    }
};

export default uploadVideo;