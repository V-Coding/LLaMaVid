import React, { useEffect, useRef, useState } from 'react';
import FileEntry from './FileEntry';
import { useFiles } from './contexts/FilesContext';

interface SidebarProps {
}

const Sidebar: React.FC<SidebarProps> = () => {
    const { files, addFiles, deleteFile } = useFiles();
    const [isVisible, setIsVisible] = useState<boolean>(false);

    useEffect(() => {
        if (files.length == 0) {
            setIsVisible(false)
        } else {
            setIsVisible(true);
        }
    }, [files]);

    return isVisible ? (
        <div style={{
            width: '250px',
            height: '100vh',
            // borderLeft: '1px solid #253237',
            padding: '0 10px',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9'
        }}>
            {files.map((file, i) => (
                <FileEntry key={i} file={file} onDelete={deleteFile} />
            ))}
        </div>
    ) : (<></>);
};

export default Sidebar;
