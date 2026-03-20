import { useState } from "react";
import { ApiService } from "../api/apiService";
import type { TurbineCommand } from "../types/api";

interface CommandPanelProps {
    turbineId: string;
}

export default function CommandPanel({ turbineId }: CommandPanelProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [stopReason, setStopReason] = useState("");
    const [intervalValue, setIntervalValue] = useState(10);
    const [pitchAngle, setPitchAngle] = useState(15);

    async function sendCommand(command: TurbineCommand) {
        setLoading(true);
        setResult(null);

        try {
            const response = await ApiService.sendCommand(turbineId, command);
            setResult({ success: true, message: `${response.status} to ${response.topic}` });
            if (command.action === "stop") {
                setStopReason("");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to send command";
            setResult({ success: false, message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {result && (
                <div className={`alert ${result.success ? "alert-success" : "alert-error"}`}>
                    <span>{result.message}</span>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-base-300 bg-base-200/70 p-4">
                    <p className="mb-3 font-medium">Start turbine</p>
                    <button
                        className="btn btn-success w-full"
                        onClick={() => sendCommand({ action: "start" })}
                        disabled={loading}
                    >
                        Start
                    </button>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-200/70 p-4">
                    <p className="mb-3 font-medium">Stop turbine</p>
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="Reason"
                            value={stopReason}
                            onChange={(event) => setStopReason(event.target.value)}
                        />
                        <button
                            className="btn btn-error w-full"
                            onClick={() => sendCommand({ action: "stop", reason: stopReason || undefined })}
                            disabled={loading}
                        >
                            Stop
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label className="label">
                        <span className="label-text">Reporting interval</span>
                    </label>
                    <div className="join w-full">
                        <input
                            type="number"
                            min={1}
                            max={60}
                            className="input input-bordered join-item w-full"
                            value={intervalValue}
                            onChange={(event) => setIntervalValue(Number(event.target.value))}
                        />
                        <button
                            className="btn btn-primary join-item"
                            onClick={() => sendCommand({ action: "setInterval", value: intervalValue })}
                            disabled={loading}
                        >
                            Apply
                        </button>
                    </div>
                </div>

                <div>
                    <label className="label">
                        <span className="label-text">Blade pitch</span>
                    </label>
                    <div className="join w-full">
                        <input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            className="input input-bordered join-item w-full"
                            value={pitchAngle}
                            onChange={(event) => setPitchAngle(Number(event.target.value))}
                        />
                        <button
                            className="btn btn-primary join-item"
                            onClick={() => sendCommand({ action: "setPitch", angle: pitchAngle })}
                            disabled={loading}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
