import { useState } from "react";
import Tab from "./components/Tab"
import TextArea from "./components/TextArea";
import UploadBox from "./components/UploadBox";
import { useFiles } from "./contexts/FilesContext"
import DetectButton from "./DetectButton";
import uploadVideo from "./utils/uploadFile";
import VideoPlayer from "./components/VideoPlayer";
import { Plus } from "lucide-react";
import FramesList from "./FramesList";
import theme from './theme'

const UploadPage = () => {
    const [prompt, setPrompt] = useState<string>("");
    const [frameInterval, setFrameInterval] = useState<string>(""); // new state
    const [maxTimesteps, setMaxTimesteps] = useState<string>(""); // new state
    const { selectFile, deleteFile, files, addFiles, timestamps, setTimestamps, selectedFile } = useFiles();

    const selectedFileIndex = files.findIndex((f) => f == selectedFile);
    const selectedFileTimestamps = timestamps[selectedFileIndex];
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const uploadVid = async (file: File, index: number, prompt: string) => {
        if (prompt == "" || isLoading) {
            return
        }
        setIsLoading(true);
        console.log("UPLOADING...")
        const result = await uploadVideo(file, prompt, parseFloat(frameInterval), parseInt(maxTimesteps));
        console.log(timestamps);
        setTimestamps((prev) => prev.map((tm, i) => i == index ? result.timestamps : tm))
        setIsLoading(false);
    }

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.background,
            fontFamily: '"Press Start 2P", monospace', // Retro gaming font
            color: theme.primary,
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: '100%',
                    padding: '0 10px',
                    height: 'fit-content',
                    display: 'flex',
                    flexDirection: 'row'
                }}>
                    {
                        files.map((f, i) =>
                            <Tab key={i} tabName={f.name} onClick={() => selectFile(f)} onDelete={() => deleteFile(f)} />
                        )}
                    {files.length > 0 && (
                        <div
                            onClick={() => selectFile(null)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                border: `2px solid ${theme.primary}`,
                                borderRadius: '4px',
                                padding: '6px',
                                marginRight: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 5px rgba(0, 255, 0, 0.3)',
                                width: '30px',
                                height: '30px',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                                e.currentTarget.style.boxShadow = '0 0 5px rgba(0, 255, 0, 0.3)';
                            }}
                        >
                            <Plus size={16} color="#00ff00" /> {/* Using the theme.primary color */}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div style={{
                        width: '300px',
                        height: '400px',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        border: `2px solid ${theme.primary}`,
                        color: theme.primary,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '4px',
                        boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                    }}>
                        <FramesList />
                    </div>
                    {(selectedFile) ? (
                        <div style={{
                            backgroundColor: 'rgba(0, 255, 0, 0.1)',
                            border: `2px solid ${theme.primary}`,
                            padding: '20px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            height: '400px',
                            width: '700px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                        }}>
                            {selectedFile ? (<VideoPlayer file={selectedFile} timestamps={selectedFileTimestamps ? selectedFileTimestamps : []} />) : <p>no selected file!</p>}
                        </div>
                    ) : (
                        <div style={{
                            // backgroundColor: 'rgba(0, 255, 0, 0.1)',
                            // border: `2px solid ${theme.primary}`,
                            // padding: '20px',
                            // textAlign: 'center',
                            // borderRadius: '4px',
                            height: '400px',
                            width: '700px',
                            // display: 'flex',
                            // flexDirection: 'column',
                            // justifyContent: 'center',
                            // alignItems: 'center',
                            // boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                        }}>
                            <UploadBox onDrop={addFiles} />
                        </div>)}
                </div>

                <TextArea
                    value={prompt}
                    setValue={setPrompt}
                    placeholder='Enter object to detect...'
                    style={{
                        width: '100%',
                        height: '50px',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        border: `2px solid ${theme.primary}`,
                        color: theme.primary,
                        fontFamily: '"Press Start 2P", monospace',
                        marginTop: '20px',
                        padding: '10px',
                        borderRadius: '4px',
                        outline: 'none'
                    }}
                />
                <div style={{
                    display: 'flex',
                    width: '100%',
                    gap: '20px',
                    marginTop: '20px',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <input
                            type="number"
                            value={frameInterval}
                            onChange={(e) => setFrameInterval(e.target.value)}
                            step="0.1"
                            min="0.1"
                            placeholder="Frame Sampling Interval (seconds)"
                            style={{
                                width: '100%',
                                height: '50px',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                border: `2px solid ${theme.primary}`,
                                color: theme.primary,
                                fontFamily: '"Press Start 2P", monospace',
                                padding: '10px',
                                borderRadius: '4px',
                                outline: 'none',
                                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                                fontSize: '12px'
                            }}
                        />
                    </div>

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <input
                            type="number"
                            value={maxTimesteps}
                            onChange={(e) => setMaxTimesteps(e.target.value)}
                            min="1"
                            placeholder="Maximum Timesteps"
                            style={{
                                width: '100%',
                                height: '50px',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                border: `2px solid ${theme.primary}`,
                                color: theme.primary,
                                fontFamily: '"Press Start 2P", monospace',
                                padding: '10px',
                                borderRadius: '4px',
                                outline: 'none',
                                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
                                fontSize: '12px'
                            }}
                        />
                    </div>
                </div>
                <DetectButton text={isLoading ? "Loading..." : "Find Objects"} onClick={() => {
                    console.log("Clicked!");
                    uploadVid(selectedFile, selectedFileIndex, prompt);
                }} />
            </div>
        </div>)
}

export default UploadPage;