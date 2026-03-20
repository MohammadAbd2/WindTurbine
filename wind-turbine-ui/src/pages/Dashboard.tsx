import { useEffect, useState } from "react";
import { ApiService, connectAlertsStream, connectMetricsStream } from "../api/apiService";
import Navbar from "../components/Navbar";
import TurbineCard from "../components/TurbineCard";
import type { ApiStreamAlert, ApiTurbine, TurbineViewModel } from "../types/api";
import { deriveStatus, getLatestMetric, mapAlertEntityToStream, mapTurbineToViewModel, sortAlertsDesc } from "../utils/turbine";

function mergeFleetState(
    turbines: ApiTurbine[],
    liveMetricsByTurbine: Record<string, ApiTurbine["metrics"][number]>,
    liveAlertsByTurbine: Record<string, ApiStreamAlert[]>,
): TurbineViewModel[] {
    return turbines.map((turbine) => {
        const fallbackMetric = getLatestMetric(turbine.metrics);
        const latestMetric = liveMetricsByTurbine[turbine.id] ?? fallbackMetric;
        const alerts = (liveAlertsByTurbine[turbine.id] ?? turbine.alerts.map(mapAlertEntityToStream)).sort(sortAlertsDesc);

        return {
            ...mapTurbineToViewModel(turbine),
            latestMetric,
            alerts,
            status: deriveStatus(latestMetric),
        };
    });
}

export default function Dashboard() {
    const [turbines, setTurbines] = useState<ApiTurbine[]>([]);
    const [fleet, setFleet] = useState<TurbineViewModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [streamState, setStreamState] = useState("Connecting to stateless SSE");

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await ApiService.getTurbines();
                if (!active) {
                    return;
                }

                setTurbines(data);
                setFleet(data.map(mapTurbineToViewModel));
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
    }, []);

    useEffect(() => {
        if (turbines.length === 0) {
            return;
        }

        const latestMetrics: Record<string, ApiTurbine["metrics"][number]> = {};
        const latestAlerts: Record<string, ApiStreamAlert[]> = {};

        const syncFleet = () => {
            setFleet(mergeFleetState(turbines, latestMetrics, latestAlerts));
        };

        const metricsSource = connectMetricsStream(
            null,
            (payload) => {
                payload.metrics.forEach((metric) => {
                    const existing = latestMetrics[metric.turbineId];
                    if (!existing || new Date(metric.timestamp).getTime() >= new Date(existing.timestamp).getTime()) {
                        latestMetrics[metric.turbineId] = metric;
                    }
                });
                setStreamState("Metrics SSE live");
                syncFleet();
            },
            () => setStreamState("Metrics SSE reconnecting"),
        );

        const alertsSource = connectAlertsStream(
            null,
            (payload) => {
                payload.alerts.forEach((alert) => {
                    latestAlerts[alert.turbineId] = [...(latestAlerts[alert.turbineId] ?? []), alert]
                        .sort(sortAlertsDesc)
                        .slice(0, 5);
                });
                setStreamState("Metrics and alerts SSE live");
                syncFleet();
            },
            () => setStreamState("Alerts SSE reconnecting"),
        );

        return () => {
            metricsSource.close();
            alertsSource.close();
        };
    }, [turbines]);

    const activeCount = fleet.filter((turbine) => turbine.status === "running").length;
    const totalPower = fleet.reduce((sum, turbine) => sum + (turbine.latestMetric?.powerOutput ?? 0), 0);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar streamLabel={streamState} />

            <main className="mx-auto max-w-7xl p-6">
                <section className="mb-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="rounded-[2rem] border border-base-300 bg-gradient-to-br from-cyan-950 to-slate-900 p-8 text-cyan-50 shadow-xl">
                        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan-200/70">Wind Farm Control</p>
                        <h1 className="text-4xl font-black tracking-tight">Backend-driven turbine overview</h1>
                        <p className="mt-3 max-w-2xl text-sm text-cyan-100/80">
                            Initial state is loaded from Swagger-backed REST endpoints, then updated from stateless SSE snapshots emitted by the API.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <StatCard label="Turbines" value={`${fleet.length}`} helper={`${activeCount} running`} />
                        <StatCard label="Power Output" value={`${totalPower.toFixed(1)} kW`} helper="Latest fleet snapshot" />
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {fleet.map((turbine) => (
                        <TurbineCard key={turbine.id} turbine={turbine} />
                    ))}
                </section>
            </main>
        </div>
    );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
    return (
        <div className="rounded-[1.5rem] border border-base-300 bg-base-100 p-5 shadow-md">
            <p className="text-sm text-base-content/60">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-base-content/50">{helper}</p>
        </div>
    );
}
