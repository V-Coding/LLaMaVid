import theme from './theme'
interface DetectButtonProps {
    text: string;
    onClick: () => void;
}

const DetectButton: React.FC<DetectButtonProps> = ({ text, onClick }) => {
    return (
        <button style={{
            cursor: 'pointer',
            width: '100%',
            background: theme.primary,
            border: 'none',
            borderRadius: '4px',
            marginTop: '15px',
            color: theme.background,
            padding: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
        }} onClick={onClick}>
            {text}
        </button>
    )
}
export default DetectButton;