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

    // UI Feedback states: tracks what is currently active on the turbine
    const [appliedInterval, setAppliedInterval] = useState(10);
    const [appliedPitch, setAppliedPitch] = useState(15);

    const sendCommand = async (command: TurbineCommand) => {
        setLoading(true);
        setResult(null);

        try {
            const response = await MockAPI.sendCommand(turbineId, command);
            setResult(response);

            // If successful, update our visual tracking states
            if (response.success) {
                if (command.action === "setInterval") setAppliedInterval(command.value);
                if (command.action === "setPitch") setAppliedPitch(command.angle);
                if (command.action === "start" || command.action === "stop") setStopReason("");
            }
        } catch {
            setResult({ success: false, message: "Failed to send command" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Global Result Message */}
            {result && (
                <div className={`alert ${result.success ? "alert-success text-success-content" : "alert-error text-error-content"} shadow-sm py-2`}>
                    <span>{result.success ? "✓" : "✗"} {result.message}</span>
                </div>
            )}

            {/* Quick Actions (Start / Stop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Turbine */}
                <div className="bg-base-200 rounded-lg p-4 flex flex-col justify-center items-center border border-base-300">
                    <p className="font-semibold mb-3 text-base-content/80">Resume Operations</p>
                    <button
                        className="btn btn-success text-white w-full max-w-xs"
                        onClick={() => sendCommand({ action: "start" })}
                        disabled={loading}
                    >
                        ▶ Start Turbine
                    </button>
                </div>

                {/* Stop Turbine */}
                <div className="bg-base-200 rounded-lg p-4 flex flex-col justify-center items-center border border-base-300">
                    <p className="font-semibold mb-3 text-base-content/80">Halt Operations</p>
                    <div className="w-full max-w-xs flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Reason for stopping (optional)..."
                            className="input input-bordered w-full input-sm"
                            value={stopReason}
                            onChange={(e) => setStopReason(e.target.value)}
                        />
                        <button
                            className="btn btn-error text-white w-full"
                            onClick={() => sendCommand({ action: "stop", reason: stopReason || undefined })}
                            disabled={loading}
                        >
                            ⏹ Stop Turbine
                        </button>
                    </div>
                </div>
            </div>

            <div className="divider my-0">Configuration Parameters</div>

            {/* Parameter Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reporting Interval */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Reporting Interval (1-60)</span>
                        {intervalValue !== appliedInterval && (
                            <span className="label-text-alt text-warning font-semibold">Unsaved</span>
                        )}
                    </label>
                    <div className="join w-full">
                        <input
                            type="number"
                            min={1}
                            max={60}
                            className="input input-bordered join-item w-full"
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(Number(e.target.value))}
                        />
                        <div className="btn btn-disabled join-item rounded-none bg-base-200 border-base-300 text-base-content/70">
                            sec
                        </div>
                        <button
                            className={`btn join-item w-24 ${intervalValue !== appliedInterval ? "btn-primary" : "btn-neutral"}`}
                            onClick={() => sendCommand({ action: "setInterval", value: intervalValue })}
                            disabled={loading || intervalValue === appliedInterval}
                        >
                            {intervalValue !== appliedInterval ? "Apply" : "Active"}
                        </button>
                    </div>
                </div>

                {/* Blade Pitch */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Blade Pitch (0-30)</span>
                        {pitchAngle !== appliedPitch && (
                            <span className="label-text-alt text-warning font-semibold">Unsaved</span>
                        )}
                    </label>
                    <div className="join w-full">
                        <input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            className="input input-bordered join-item w-full"
                            value={pitchAngle}
                            onChange={(e) => setPitchAngle(Number(e.target.value))}
                        />
                        <div className="btn btn-disabled join-item rounded-none bg-base-200 border-base-300 text-base-content/70">
                            deg
                        </div>
                        <button
                            className={`btn join-item w-24 ${pitchAngle !== appliedPitch ? "btn-primary" : "btn-neutral"}`}
                            onClick={() => sendCommand({ action: "setPitch", angle: pitchAngle })}
                            disabled={loading || pitchAngle === appliedPitch}
                        >
                            {pitchAngle !== appliedPitch ? "Apply" : "Active"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}