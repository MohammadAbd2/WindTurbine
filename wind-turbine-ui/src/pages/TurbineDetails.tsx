import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiService, connectAlertsStream, connectMetricsStream } from "../api/apiService";
import AlertsPanel from "../components/AlertsPanel";
import CommandPanel from "../components/CommandPanel";
import MetricsChart from "../components/MetricsChart";
import Navbar from "../components/Navbar";
import type { ApiMetric, ApiStreamAlert, ApiTurbine } from "../types/api";
import { getLatestMetric, mapAlertEntityToStream, sortAlertsDesc, sortMetricsDesc, stripSeverityPrefix } from "../utils/turbine";

export default function TurbineDetails() {
    const { id } = useParams<{ id: string }>();
    const [turbine, setTurbine] = useState<ApiTurbine | null>(null);
    const [metrics, setMetrics] = useState<ApiMetric[]>([]);
    const [alerts, setAlerts] = useState<ApiStreamAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [streamState, setStreamState] = useState("Connecting to turbine stream");

    useEffect(() => {
        if (!id) {
            return;
        }
        const turbineId = id;

        let active = true;

        async function load() {
            try {
                const [turbineData, metricsData, alertsData] = await Promise.all([
                    ApiService.getTurbineById(turbineId),
                    ApiService.getMetrics(turbineId),
                    ApiService.getAlerts(turbineId),
                ]);

                if (!active) {
                    return;
                }

                setTurbine(turbineData);
                setMetrics(metricsData.sort(sortMetricsDesc));
                setAlerts(alertsData.map(mapAlertEntityToStream).sort(sortAlertsDesc));
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        const metricsSource = connectMetricsStream(
            id,
            (payload) => {
                setMetrics((current) => {
                    const merged = [...current];
                    payload.metrics.forEach((metric) => {
                        if (!merged.some((entry) => entry.id === metric.id)) {
                            merged.push(metric);
                        }
                    });
                    return merged.sort(sortMetricsDesc).slice(0, 50);
                });

                setAlerts((current) => {
                    const existingIds = new Set(current.map((alert) => alert.id));
                    const incoming = payload.alerts
                        .filter((alert) => !existingIds.has(alert.id))
                        .map((alert) => ({
                            id: alert.id,
                            turbineId: alert.turbineId,
                            farmId: "6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7",
                            severity: "info" as const,
                            message: stripSeverityPrefix(alert.message),
                            timestamp: alert.timestamp,
                        }));

                    return [...incoming, ...current].sort(sortAlertsDesc).slice(0, 20);
                });

                setStreamState("Metrics SSE live");
            },
            () => setStreamState("Metrics SSE reconnecting"),
        );

        const alertsSource = connectAlertsStream(
            id,
            (payload) => {
                setAlerts(payload.alerts.sort(sortAlertsDesc));
                setStreamState("Metrics and alerts SSE live");
            },
            () => setStreamState("Alerts SSE reconnecting"),
        );

        return () => {
            metricsSource.close();
            alertsSource.close();
        };
    }, [id]);

    if (!id) {
        return <div className="p-8">Invalid turbine ID.</div>;
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!turbine) {
        return (
            <div className="p-8">
                <p>Turbine not found.</p>
                <Link to="/" className="link link-primary">Return to dashboard</Link>
            </div>
        );
    }

    const latestMetric = getLatestMetric(metrics);

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar title={turbine.name} streamLabel={streamState} />

            <main className="mx-auto max-w-7xl p-6">
                <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                    <Link to="/" className="link link-hover">Dashboard</Link>
                    <span>/</span>
                    <span>{turbine.id}</span>
                </div>

                <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <DetailStat label="Location" value={turbine.location} />
                    <DetailStat label="Wind Speed" value={latestMetric ? `${latestMetric.windSpeed.toFixed(1)} m/s` : "No data"} />
                    <DetailStat label="Temperature" value={latestMetric ? `${latestMetric.temperature.toFixed(1)} C` : "No data"} />
                    <DetailStat label="Power Output" value={latestMetric ? `${latestMetric.powerOutput.toFixed(1)} kW` : "No data"} />
                    <DetailStat label="Updated" value={latestMetric ? new Date(latestMetric.timestamp).toLocaleString() : "Awaiting telemetry"} />
                </section>

                <section className="mb-6">
                    <MetricsChart data={metrics} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.5rem] border border-base-300 bg-base-100 p-6 shadow-md">
                        <h2 className="mb-4 text-lg font-semibold">Operator Commands</h2>
                        <CommandPanel turbineId={id} />
                    </div>

                    <div className="rounded-[1.5rem] border border-base-300 bg-base-100 p-6 shadow-md">
                        <AlertsPanel alerts={alerts} />
                    </div>
                </section>
            </main>
        </div>
    );
}

function DetailStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[1.5rem] border border-base-300 bg-base-100 p-5 shadow-sm">
            <p className="text-sm text-base-content/55">{label}</p>
            <p className="mt-2 text-lg font-semibold">{value}</p>
        </div>
    );
}
