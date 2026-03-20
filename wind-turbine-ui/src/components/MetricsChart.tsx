import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { ApiMetric } from "../types/api";

interface MetricsChartProps {
    data: ApiMetric[];
}

export default function MetricsChart({ data }: MetricsChartProps) {
    const chartData = [...data]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((metric) => ({
            ...metric,
            time: new Date(metric.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        }));

    return (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-semibold">Telemetry History</h2>
                <p className="text-sm text-base-content/60">Live SSE snapshots combined with stored database metrics.</p>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
                        <XAxis dataKey="time" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="windSpeed" name="Wind Speed" stroke="#0f766e" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="temperature" name="Temperature" stroke="#ea580c" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="powerOutput" name="Power Output" stroke="#1d4ed8" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
