import Page from "./Page";
import { FilesProvider } from "./contexts/FilesContext";
import { SelectedFileProvider } from "./contexts/SelectedFileContext";
import UploadPage from "./UploadPage";

const App = () => {
    return (
        <Page>
            <FilesProvider>
                <SelectedFileProvider>
                    <UploadPage />
                </SelectedFileProvider>
            </FilesProvider>
        </Page>)
}

export default App;