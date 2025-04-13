import { useEffect, useState } from "react";
import { useFiles } from "./contexts/FilesContext";
import VideoPlayer from "./LibraryVideoPlayer";
import Tab from "./Tab";
import { useSelectedFile } from "./contexts/SelectedFileContext";

const DisplayScreen = () => {
    const { files, addFiles, deleteFile, timestamps, setTimestamps } = useFiles();
    const { selectedFile, selectFile } = useSelectedFile();
    const selectedFileIndex = files.findIndex((f) => f == selectedFile);

    return (
        <div style={{
            width: '350px',
        }}>
            <div style={{
                width: '100%',
                padding: '0 10px',
                height: 'fit-content',
                display: 'flex',
                flexDirection: 'row'
            }}>
                {files.map((f, i) => <Tab key={i} tabName={f.name} onClick={() => selectFile(f)} />)}
            </div>
            <div style={{
                backgroundColor: '#f0f2ef',
                padding: '20px',
                textAlign: 'center',
                borderRadius: '8px',
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {selectedFile ? (<VideoPlayer file={selectedFile} timestamps={timestamps[selectedFileIndex]} />) : <p>no selected file!</p>}
            </div>
        </div>
    )
}
export default DisplayScreen;