import React from 'react';
import { useSelectedFile } from './contexts/SelectedFileContext';
import { useFiles } from './contexts/FilesContext';
import FramesList from './FramesList';

const Sidebar: React.FC = () => {
    const sidebarStyle: React.CSSProperties = {
        width: '300px',
        height: '100vh',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
    };

    return (
        <aside style={sidebarStyle}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '40px' }}>48 Seconds</h2>
            <FramesList />
        </aside>
    );
};

export default Sidebar;
