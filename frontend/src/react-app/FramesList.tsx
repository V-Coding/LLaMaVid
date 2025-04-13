import { useEffect, useState } from "react";
import { useFiles } from "./contexts/FilesContext";
import { useSelectedFile } from "./contexts/SelectedFileContext";
import extractFramesAsBlobs from "./utils/extractImage";
import formatTime from "./utils/formatTime";
import eventBus from "./utils/eventBus";


type FrameImageProps = {
    src: string; // Blob URL
    alt?: string;
    style?: React.CSSProperties;
};

const FrameImage: React.FC<FrameImageProps> = ({ src, alt = 'Video Frame', style = {} }) => {
    return <img src={src} alt={alt} style={style} />;
};

const FramesList = () => {

    const { files, addFiles, deleteFile, timestamps, setTimestamps } = useFiles();
    const { selectedFile, selectFile } = useSelectedFile();
    // console.log(selectedFile.name);
    const [frameBlobs, setFrameBlobs] = useState<string[]>([]);
    const selectedFileIndex = files.findIndex(file => file === selectedFile);
    const selectedFileTimestamps = timestamps[selectedFileIndex] || [];
    useEffect(() => {
        if (selectedFile && selectedFileTimestamps.length > 0) {
            extractFramesAsBlobs(selectedFile, selectedFileTimestamps)
                .then(setFrameBlobs)
                .catch((error) => console.error('Error extracting frames:', error));
        }
    }, [selectedFile, selectedFileTimestamps]);
    console.log(frameBlobs);

    const selectTimestamp = (timestamp: number) => {
        eventBus.dispatchEvent(new CustomEvent("selectTimestamp", { detail: timestamp }));
    }

    if (files.length == 0 || timestamps.length == 0) {
        return (<></>)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'scroll', scrollbarWidth: 'none' }}>
            {frameBlobs.map((blob, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                    onClick={() => selectTimestamp(selectedFileTimestamps[index])}>
                    <p style={{ color: 'white' }}>{formatTime(selectedFileTimestamps[index])}</p>
                    <FrameImage src={blob} alt={`Frame ${index + 1}`} style={{ width: '100%' }} />
                </div>
            ))}
        </div>
    )
}
export default FramesList;