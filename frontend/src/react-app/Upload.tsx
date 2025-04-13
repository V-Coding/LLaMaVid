import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFiles } from './contexts/FilesContext';
import uploadVideo from './utils/uploadFile';
import TextArea from './TextArea';
import { useSelectedFile } from './contexts/SelectedFileContext';

const MyDropzone: React.FC = () => {
    const { files, addFiles, deleteFile, timestamps, setTimestamps } = useFiles();
    const { selectedFile, selectFile } = useSelectedFile();

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles: File[]) => {
            console.log(acceptedFiles);
            // setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
            addFiles(acceptedFiles)
        },
    });
    const [prompt, setPrompt] = useState<string>("");

    const uploadVideos = async (files: File[], prompt: string) => {
        if (files.length == 0 || prompt == "") {
            return;
        }
        const results = await Promise.all(files.map((f) => uploadVideo(f, prompt, 1.0, 20)))
        const mapped: number[][] = results.map((ur) => ur.timestamps)
        setTimestamps(mapped);
        selectFile(files[0]);
    }

    return (
        <div style={{
            // display: 'flex',
            // flexDirection: 'row',
            // justifyItems: 'center',
            // height: '100px',
            width: '350px'
        }}>
            <div {...getRootProps()}
                style={{
                    // backgroundColor: '#f0f2ef',
                    // border: '2px dashed #253237',
                    // padding: '20px',
                    // textAlign: 'center',
                    // borderRadius: '8px',
                    // height: '350px'
                    backgroundColor: '#f0f2ef',
                    border: '2px dashed #253237',
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    height: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                <input {...getInputProps()} />
                <p>Drag and drop or click to upload videos</p>
            </div>
            {/* <div style={{
                width: '100%',
                maxWidth: '350px',
                padding: '2px 25px',
                overflow: 'auto',
                height: '150px',
                borderColor: '#253237',
                borderWidth: '1px',
                borderRadius: '15px',
                marginTop: '5px',
                scrollbarWidth: 'thin',
                scrollbarGutter: 'stable'
            }}>
                {files.map((file, i) => {
                    return <FileEntry key={`${i}`} file={file} onDelete={deleteFile} />
                })}
            </div> */}
            <div style={{
                width: '100%'
            }}>
                <TextArea value={prompt} setValue={setPrompt}
                    placeholder='Enter object to detect...'
                    style={{
                        width: '100%',
                        height: '50px',
                        overflowX: 'auto',
                        overflowY: 'scroll',
                        marginTop: '20px',
                        padding: '10px'
                    }} />
            </div>
            <button style={{
                cursor: 'pointer',
                width: '100%',
                background: '#fe938c',
                borderRadius: '15px',
                marginTop: '15px',
                color: '#253237',
                padding: '5px'
            }}
                onClick={() => uploadVideos(files, prompt)}>
                Find Objects
            </button>
        </div>
    );
};

export default MyDropzone;