import { createContext, useContext, useState, ReactNode } from 'react';

type SelectedFileContextType = {
    selectedFile: File | null;
    selectFile: (file: File) => void;
};

const SelectedFileContext = createContext<SelectedFileContextType | undefined>(undefined);

export const SelectedFileProvider = ({ children }: { children: ReactNode }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const selectFile = (file: File) => setSelectedFile(file);

    return (
        <SelectedFileContext.Provider value={{ selectedFile, selectFile }}>
            {children}
        </SelectedFileContext.Provider>
    );
};

export const useSelectedFile = () => {
    const context = useContext(SelectedFileContext);
    if (!context) throw new Error('useSelectedFile must be used within SelectedFileProvider');
    return context;
};
