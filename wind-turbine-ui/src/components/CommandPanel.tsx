import { useState } from "react";
import { MockAPI } from "../mocks/mockApi";
import type { TurbineCommand } from "../mocks/mockData";

interface CommandPanelProps {
    turbineId: string;
}

export default function CommandPanel({ turbineId }: CommandPanelProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    
    // Form states for commands with parameters
    const [stopReason, setStopReason] = useState("");
    const [intervalValue, setIntervalValue] = useState(10);
    const [pitchAngle, setPitchAngle] = useState(15);

    const sendCommand = async (command: TurbineCommand) => {
        setLoading(true);
        setResult(null);

        try {
            const response = await MockAPI.sendCommand(turbineId, command);
            setResult(response);
        } catch {
            setResult({ success: false, message: "Failed to send command" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Start / Stop */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                    onClick={() => sendCommand({ action: "start" })}
                    disabled={loading}
                    style={{ backgroundColor: "#52c41a", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    ▶ Start
                </button>
                
                <input
                    type="text"
                    placeholder="Stop reason (optional)"
                    value={stopReason}
                    onChange={(e) => setStopReason(e.target.value)}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}
                />
                <button
                    onClick={() => sendCommand({ action: "stop", reason: stopReason || undefined })}
                    disabled={loading}
                    style={{ backgroundColor: "#ff4d4f", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    ⏹ Stop
                </button>
            </div>

            {/* Set Reporting Interval */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label>Reporting Interval:</label>
                <input
                    type="number"
                    min={1}
                    max={60}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                    style={{ width: "60px", padding: "8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}
                />
                <span>seconds (1-60)</span>
                <button
                    onClick={() => sendCommand({ action: "setInterval", value: intervalValue })}
                    disabled={loading}
                    style={{ padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    Set Interval
                </button>
            </div>

            {/* Set Blade Pitch */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label>Blade Pitch:</label>
                <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={pitchAngle}
                    onChange={(e) => setPitchAngle(Number(e.target.value))}
                    style={{ width: "60px", padding: "8px", borderRadius: "4px", border: "1px solid #d9d9d9" }}
                />
                <span>degrees (0-30)</span>
                <button
                    onClick={() => sendCommand({ action: "setPitch", angle: pitchAngle })}
                    disabled={loading}
                    style={{ padding: "8px 16px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                    Set Pitch
                </button>
            </div>

            {/* Result message */}
            {result && (
                <p style={{ color: result.success ? "#52c41a" : "#ff4d4f", margin: 0 }}>
                    {result.success ? "✓" : "✗"} {result.message}
                </p>
            )}
        </div>
    );
}