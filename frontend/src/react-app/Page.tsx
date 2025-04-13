import React, { ReactNode } from "react";

interface PageProps {
    children: ReactNode
}
const Page: React.FC<PageProps> = ({ children }) => {
    return (
        <div style={{
            display: 'flex',
            // justifyContent: 'center',  // Horizontal center
            // alignItems: 'center',      // Vertical center
            height: '100vh',            // Fills parent height
            width: '100wh',              // Fills parent width
        }}>
            {children}
        </div>
    );
}
export default Page;