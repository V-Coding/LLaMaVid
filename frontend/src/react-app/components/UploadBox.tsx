import { useDropzone } from "react-dropzone";
import theme from "../theme";

interface UploadBoxProps {
    onDrop: (arg0: File[]) => void;
}
const UploadBox: React.FC<UploadBoxProps> = ({ onDrop }) => {
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: onDrop,
    });
    return (
        <div {...getRootProps()}
            style={{
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                border: `2px dashed ${theme.primary}`,
                padding: '20px',
                textAlign: 'center',
                borderRadius: '4px',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: theme.primary,
                fontFamily: '"Press Start 2P", monospace',
                boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)',
            }}>
            <input {...getInputProps()} />
            <p>Drag and drop or click to upload videos</p>
        </div>
    )
}

export default UploadBox;