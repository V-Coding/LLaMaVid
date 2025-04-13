import Page from "./Page";
import Sidebar from "./Sidebar";
import { FilesProvider } from "./contexts/FilesContext";
import MainArea from "./MainArea";
import LeftSidebar from "./LeftSidebar";
import { SelectedFileProvider } from "./contexts/SelectedFileContext";

const App = () => {
    return (
        <Page>
            <FilesProvider>
                <SelectedFileProvider>
                    <LeftSidebar />
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        // display: 'flex',
                        // flexDirection: 'column',
                        // alignItems: 'center',
                        // gap: '4px'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <MainArea />
                        </div>
                    </div>
                    <Sidebar />
                </SelectedFileProvider>
            </FilesProvider>
        </Page>)
}

export default App;