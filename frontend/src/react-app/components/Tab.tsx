import { X } from "lucide-react";
import theme from '../theme';
interface TabProps {
    tabName: string;
    onClick: () => void;
    onDelete: () => void;
}

const Tab: React.FC<TabProps> = ({ tabName, onClick, onDelete }) => {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                color: theme.primary,
                padding: '8px 12px',
                borderRadius: '4px',
                marginRight: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                maxWidth: '140px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                border: `1px solid ${theme.primary}`,
                transition: 'all 0.3s ease',
                boxShadow: '0 0 5px rgba(0, 255, 0, 0.3)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)')}
        >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tabName}</span>
            <X
                color='red'
                size={16}
                style={{ marginLeft: 6 }}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            />
        </div>
    );
};

export default Tab;
