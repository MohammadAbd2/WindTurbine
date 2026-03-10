import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MetricsChart from "../components/MetricsChart";
import AlertsPanel from "../components/AlertsPanel";
import CommandPanel from "../components/CommandPanel";
import { MockAPI, subscribeToTelemetry } from "../mocks/mockApi";
import type { Telemetry, Turbine } from "../mocks/mockData";

export default function TurbineDetails() {
    const { id } = useParams<{ id: string }>();
    const [turbine, setTurbine] = useState<Turbine | undefined>(undefined);
    const [telemetryHistory, setTelemetryHistory] = useState<Telemetry[]>([]);
    const [latestTelemetry, setLatestTelemetry] = useState<Telemetry | null>(null);

    // Load turbine info and history
    useEffect(() => {
        if (!id) return;
        MockAPI.getTurbine(id).then(setTurbine);
        MockAPI.getTelemetryHistory(id).then((history) => {
            setTelemetryHistory(history);
            if (history.length > 0) {
                setLatestTelemetry(history[history.length - 1]);
            }
        });
    }, [id]);

    // Subscribe to realtime telemetry
    useEffect(() => {
        if (!id) return;

        const unsubscribe = subscribeToTelemetry(id, (newTelemetry) => {
            setLatestTelemetry(newTelemetry);
            setTelemetryHistory((prev) => [...prev.slice(-19), newTelemetry]);
        });

        return unsubscribe;
    }, [id]);

    if (!id) return <div>Invalid turbine ID</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "1200px" }}>
            <Link to="/">← Back to Dashboard</Link>

            <h2 style={{ marginTop: "16px" }}>{turbine?.name ?? "Loading..."}</h2>
            {turbine && (
                <p style={{ color: "#666" }}>
                    📍 {turbine.location} • Status:{" "}
                    <strong style={{ color: turbine.status === "running" ? "#52c41a" : "#ff4d4f" }}>
                        {turbine.status}
                    </strong>
                </p>
            )}

            {/* Live Status Cards */}
            {latestTelemetry && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "20px 0" }}>
                    <StatusCard label="Wind Speed" value={`${latestTelemetry.windSpeed} m/s`} />
                    <StatusCard label="Power Output" value={`${latestTelemetry.powerOutput} kW`} />
                    <StatusCard label="Rotor Speed" value={`${latestTelemetry.rotorSpeed} rpm`} />
                    <StatusCard label="Blade Pitch" value={`${latestTelemetry.bladePitch}°`} />
                    <StatusCard label="Generator Temp" value={`${latestTelemetry.generatorTemp}°C`} />
                    <StatusCard label="Gearbox Temp" value={`${latestTelemetry.gearboxTemp}°C`} />
                    <StatusCard label="Vibration" value={`${latestTelemetry.vibration} mm/s`} />
                </div>
            )}

            {/* Charts */}
            <section>
                <h3>📊 Real-time Metrics</h3>

                <MetricsChart
                    data={telemetryHistory}
                    title="Power & Wind"
                    metrics={[
                        { key: "powerOutput", name: "Power Output (kW)", color: "#52c41a" },
                        { key: "windSpeed", name: "Wind Speed (m/s)", color: "#1890ff" },
                    ]}
                />

                <MetricsChart
                    data={telemetryHistory}
                    title="Temperatures"
                    metrics={[
                        { key: "generatorTemp", name: "Generator (°C)", color: "#ff4d4f" },
                        { key: "gearboxTemp", name: "Gearbox (°C)", color: "#fa8c16" },
                        { key: "ambientTemperature", name: "Ambient (°C)", color: "#13c2c2" },
                    ]}
                />

                <MetricsChart
                    data={telemetryHistory}
                    title="Mechanical"
                    metrics={[
                        { key: "rotorSpeed", name: "Rotor Speed (rpm)", color: "#722ed1" },
                        { key: "vibration", name: "Vibration (mm/s)", color: "#eb2f96" },
                    ]}
                />
            </section>

            {/* Controls */}
            <section style={{ marginTop: "30px" }}>
                <h3>🎛️ Controls</h3>
                <CommandPanel turbineId={id} />
            </section>

            {/* Alerts */}
            <AlertsPanel turbineId={id} />
        </div>
    );
}

// Simple status card component
function StatusCard({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                padding: "12px 16px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                minWidth: "120px",
            }}
        >
            <div style={{ fontSize: "12px", color: "#666" }}>{label}</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{value}</div>
        </div>
    );
}