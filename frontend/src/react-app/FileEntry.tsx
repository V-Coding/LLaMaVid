import { Trash } from "lucide-react";

interface FileEntryProps {
    file: File;
    onDelete: (file: File) => void;
}

const FileEntry: React.FC<FileEntryProps> = ({ file, onDelete }) => {
    const truncate = (name: string, max = 25) =>
        name.length > max ? `${name.slice(0, max)}...` : name;
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '10px 0',
            color: '#253237'
        }}>
            <span>{truncate(file.name)}</span>
            <span>
                <button onClick={() => onDelete(file)}
                    style={{ cursor: 'pointer' }}>
                    <Trash />
                </button>
            </span>
        </div>)
}

export default FileEntry;