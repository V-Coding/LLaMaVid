import React, { useRef, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import eventBus from "./utils/eventBus";

type FileVideoPlayerProps = {
    file: File;
    timestamps: number[];
};

const FileVideoPlayer: React.FC<FileVideoPlayerProps> = ({ file, timestamps }) => {
    const playerRef = useRef<ReactPlayer>(null);
    const [url, setUrl] = useState("");
    const [duration, setDuration] = useState(0);

    const seekToTime = (time: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time, "seconds");
        }
    }

    useEffect(() => {
        const objUrl = URL.createObjectURL(file);
        setUrl(objUrl);
        return () => URL.revokeObjectURL(objUrl);
    }, [file]);

    useEffect(() => {
        if (playerRef.current && timestamps.length > 0) {
            seekToTime(timestamps[0])
        }
    }, [url, timestamps, playerRef.current]);

    useEffect(() => {
        const handler = (e: Event) => {
            const timestamp = (e as CustomEvent<number>).detail;
            seekToTime(timestamp);
        };

        eventBus.addEventListener("selectTimestamp", handler);
        return () => eventBus.removeEventListener("selectTimestamp", handler);
    }, [])

    return (
        <div style={{ position: "relative", height: '100%' }}>
            <ReactPlayer
                ref={playerRef}
                url={url}
                controls
                width="100%"
                height="100%"
                onDuration={(d) => setDuration(d)}
            />
        </div>
    );
};

export default FileVideoPlayer;