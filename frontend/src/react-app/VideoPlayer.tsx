import React, { useRef, useState, useEffect } from "react";

type FileVideoPlayerProps = {
    file: File;
    timestamps: number[];
};

const FileVideoPlayer: React.FC<FileVideoPlayerProps> = ({ file, timestamps }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const url = URL.createObjectURL(file);

    useEffect(() => {
        const video = videoRef.current;
        if (video && timestamps.length > 0) {
            video.currentTime = timestamps[0]; // Seek to first timestamp
        }
        return () => URL.revokeObjectURL(url); // Cleanup
    }, [url]);


    const cueText = timestamps
        .map((t, i) => `${t} --> ${t + 0.1}\nMark ${i + 1}`)
        .join("\n\n");

    const vttBlob = new Blob([`WEBVTT\n\n${cueText}`], { type: "text/vtt" });
    const vttUrl = URL.createObjectURL(vttBlob);

    return (
        <div style={{ height: "100%", width: "100%" }}>
            <video
                ref={videoRef}
                src={url}
                controls
                style={{ height: "100%", width: "100%", objectFit: "contain" }}
            >
                <track
                    kind="chapters"
                    src={vttUrl}
                    label="Timestamps"
                    default />
            </video>
        </div>
    );
};

export default FileVideoPlayer;
