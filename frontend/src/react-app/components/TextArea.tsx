import { SetStateAction, useState } from "react"

interface TextAreaProps {
    value: string;
    setValue: React.Dispatch<SetStateAction<string>>;
    style: React.CSSProperties;
    placeholder: string;
}

const TextArea: React.FC<TextAreaProps> = ({ style, placeholder, value, setValue }) => {
    // const [value, setValue] = useState<string>("");
    return (
        <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            style={style}
        />)
}

export default TextArea;