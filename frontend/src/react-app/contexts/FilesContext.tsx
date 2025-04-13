import React, { createContext, SetStateAction, useContext, useState } from 'react';

type FilesContextType = {
    files: File[];
    addFiles: (newFiles: File[]) => void;
    deleteFile: (fileToDelete: File) => void;
    timestamps: number[][];
    setTimestamps: React.Dispatch<SetStateAction<number[][]>>;
};

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [timestamps, setTimestamps] = useState<number[][]>([]);

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
    };

    const deleteFile = (fileToDelete: File) => {
        const index = files.indexOf(fileToDelete);
        setTimestamps((prev) => prev.filter((t, i) => i != index));
        setFiles(prev => prev.filter(file => file !== fileToDelete));
    };

    return (
        <FilesContext.Provider value={{ files, addFiles, deleteFile, timestamps, setTimestamps }}>
            {children}
        </FilesContext.Provider>
    );
};

export const useFiles = (): FilesContextType => {
    const context = useContext(FilesContext);
    if (!context) throw new Error('useFiles must be used within a FilesProvider');
    return context;
};
