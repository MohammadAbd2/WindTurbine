import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import MetricsChart from "../components/MetricsChart";
import AlertsPanel from "../components/AlertsPanel";
import CommandPanel from "../components/CommandPanel";
import { MockAPI, subscribeToTelemetry } from "../mocks/mockApi";
import type { Telemetry, Turbine } from "../mocks/mockData";

export default function TurbineDetails() {
    const { id } = useParams<{ id: string }>();
    const [turbine, setTurbine] = useState<Turbine | null>(null);
    const [telemetryHistory, setTelemetryHistory] = useState<Telemetry[]>([]);
    const [latestTelemetry, setLatestTelemetry] = useState<Telemetry | null>(null);

    useEffect(() => {
        if (!id) return;
        MockAPI.getTurbine(id).then((t) => setTurbine(t ?? null));
        MockAPI.getTelemetryHistory(id).then((history) => {
            setTelemetryHistory(history);
            if (history.length > 0) {
                setLatestTelemetry(history[history.length - 1]);
            }
        });
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeToTelemetry(id, (newTelemetry) => {
            setLatestTelemetry(newTelemetry);
            setTelemetryHistory((prev) => [...prev.slice(-19), newTelemetry]);
        });
        return unsubscribe;
    }, [id]);

    if (!id) return <div className="p-8">Invalid turbine ID</div>;

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar title={turbine?.name ?? "Turbine Details"} />

            <div className="container mx-auto p-6">
                <div className="breadcrumbs text-sm mb-4">
                    <ul>
                        <li><Link to="/">Dashboard</Link></li>
                        <li>{turbine?.name ?? "Loading..."}</li>
                    </ul>
                </div>

                {/* Turbine Header */}
                <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold">{turbine?.name}</h1>
                    {turbine && (
                        <span className={`badge badge-lg ${turbine.status === "running" ? "badge-success" : "badge-error"}`}>
                            {turbine.status}
                        </span>
                    )}
                </div>
                {turbine && <p className="text-base-content/60 mb-6">📍 {turbine.location}</p>}

                {/* Live Stats */}
                {latestTelemetry && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                        <StatCard label="Wind Speed" value={`${latestTelemetry.windSpeed} m/s`} />
                        <StatCard label="Power Output" value={`${latestTelemetry.powerOutput} kW`} />
                        <StatCard label="Rotor Speed" value={`${latestTelemetry.rotorSpeed} rpm`} />
                        <StatCard label="Blade Pitch" value={`${latestTelemetry.bladePitch}°`} />
                        <StatCard label="Generator Temp" value={`${latestTelemetry.generatorTemp}°C`} />
                        <StatCard label="Gearbox Temp" value={`${latestTelemetry.gearboxTemp}°C`} />
                        <StatCard label="Vibration" value={`${latestTelemetry.vibration} mm/s`} />
                    </div>
                )}

                {/* Charts */}
                <div className="card bg-base-100 shadow-md mb-6">
                    <div className="card-body">
                        <h2 className="card-title">📈 Real-time Metrics</h2>
                        <MetricsChart
                            data={telemetryHistory}
                            title="Power & Wind"
                            metrics={[
                                { key: "powerOutput", name: "Power Output (kW)", color: "#22c55e" },
                                { key: "windSpeed", name: "Wind Speed (m/s)", color: "#3b82f6" },
                            ]}
                        />
                        <MetricsChart
                            data={telemetryHistory}
                            title="Temperatures"
                            metrics={[
                                { key: "generatorTemp", name: "Generator (°C)", color: "#ef4444" },
                                { key: "gearboxTemp", name: "Gearbox (°C)", color: "#f97316" },
                                { key: "ambientTemperature", name: "Ambient (°C)", color: "#06b6d4" },
                            ]}
                        />
                    </div>
                </div>

                {/* Controls */}
                <div className="card bg-base-100 shadow-md mb-6">
                    <div className="card-body">
                        <h2 className="card-title">🎛️ Controls</h2>
                        <CommandPanel turbineId={id} />
                    </div>
                </div>

                {/* Alerts */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <AlertsPanel turbineId={id} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="stat bg-base-100 rounded-lg shadow-sm p-4">
            <div className="stat-title text-xs">{label}</div>
            <div className="stat-value text-lg">{value}</div>
        </div>
    );
}