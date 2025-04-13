import React, { createContext, SetStateAction, useContext, useState } from 'react';

type FilesContextType = {
    files: File[];
    addFiles: (newFiles: File[]) => void;
    deleteFile: (fileToDelete: File) => void;
    timestamps: number[][];
    setTimestamps: React.Dispatch<SetStateAction<number[][]>>;
    selectedFile: File | null;
    selectFile: (file: File | null) => void;
};

const FilesContext = createContext<FilesContextType | undefined>(undefined);

export const FilesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [timestamps, setTimestamps] = useState<number[][]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        // Add empty timestamp arrays for each new file
        setTimestamps(prev => [...prev, ...Array(newFiles.length).fill([])]);
        if (!selectedFile && newFiles.length > 0) setSelectedFile(newFiles[0]);
    };

    const deleteFile = (fileToDelete: File) => {
        const index = files.indexOf(fileToDelete);
        const newFiles = files.filter(file => file !== fileToDelete);
        setFiles(newFiles);

        // Remove timestamps for the deleted file
        setTimestamps(prev => prev.filter((_, i) => i !== index));

        if (selectedFile === fileToDelete) {
            const newSelected = newFiles[index] || newFiles[index - 1] || null;
            setSelectedFile(newSelected);
        }
    };

    const selectFile = (file: File | null) => {
        setSelectedFile(file);
    };

    // Ensure timestamps array length matches files array length
    React.useEffect(() => {
        if (timestamps.length !== files.length) {
            if (timestamps.length < files.length) {
                // Add empty arrays if we have more files than timestamps
                setTimestamps(prev => [
                    ...prev,
                    ...Array(files.length - timestamps.length).fill([])
                ]);
            } else {
                // Trim timestamps array if we have more timestamps than files
                setTimestamps(prev => prev.slice(0, files.length));
            }
        }
    }, [files.length, timestamps.length]);

    return (
        <FilesContext.Provider value={{
            files,
            addFiles,
            deleteFile,
            timestamps,
            setTimestamps,
            selectedFile,
            selectFile
        }}>
            {children}
        </FilesContext.Provider>
    );
};

export const useFiles = (): FilesContextType => {
    const context = useContext(FilesContext);
    if (!context) throw new Error('useFiles must be used within a FilesProvider');
    return context;
};