interface TabProps {
    tabName: string;
    onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ tabName, onClick }) => {
    return (
        <div style={{
            backgroundColor: '#f0f2ef',
            textAlign: 'center',
            color: '#253237',
            width: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingLeft: '2px',
            paddingRight: '2px',
            cursor: 'pointer',
            fontSize: 10,
            borderColor: 'black',
            borderWidth: '1px'
        }}
            onClick={onClick}>
            {tabName}
        </div>
    )
}

export default Tab;