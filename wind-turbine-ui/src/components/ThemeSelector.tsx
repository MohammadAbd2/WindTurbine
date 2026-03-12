import { useTheme } from "../theme/ThemeContext";

export default function ThemeSelector() {
    const { theme, setTheme, themes } = useTheme();

    return (
        <select
            className="select select-bordered select-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
        >
            {themes.map((t) => (
                <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
            ))}
        </select>
    );
}