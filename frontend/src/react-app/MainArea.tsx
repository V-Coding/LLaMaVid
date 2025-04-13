import { useMemo } from "react";
import { useFiles } from "./contexts/FilesContext";
import UploadScreen from "./UploadScreen";
import DisplayScreen from "./DisplayScreen";

const MainArea = () => {
    const { files, addFiles, deleteFile, timestamps, setTimestamps } = useFiles();
    const isUploading = useMemo(() => timestamps.length == 0 || files.length == 0, [timestamps])
    return isUploading ? (<UploadScreen />) : (<DisplayScreen />)
}

export default MainArea;