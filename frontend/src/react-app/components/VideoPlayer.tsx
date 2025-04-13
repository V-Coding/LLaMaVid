import React, { useRef, useState, useEffect } from "react";
import eventBus from "../utils/eventBus";

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

    useEffect(() => {
        const handleSelectTimestamp = (e: CustomEvent<number>) => {
            videoRef.current.currentTime = e.detail;
        };
        const listener = (e: Event) => handleSelectTimestamp(e as CustomEvent<number>);
        eventBus.addEventListener("selectTimestamp", listener);

        return () => {
            eventBus.removeEventListener("selectTimestamp", listener);
        };
    }, []);

    return (
        <div style={{ height: "100%", width: "100%" }}>
            <video
                ref={videoRef}
                src={url}
                controls
                style={{ height: "100%", width: "100%", objectFit: "contain" }}
            >
            </video>
        </div>
    );
};

export default FileVideoPlayer;
