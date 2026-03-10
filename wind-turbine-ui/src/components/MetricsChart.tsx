import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { Telemetry } from "../mocks/mockData";

interface MetricsChartProps {
    data: Telemetry[];
    title: string;
    metrics: Array<{
        key: keyof Telemetry;
        name: string;
        color: string;
    }>;
}

export default function MetricsChart({ data, title, metrics }: MetricsChartProps) {
    // Format timestamp for display
    const formattedData = data.map((d) => ({
        ...d,
        time: new Date(d.timestamp).toLocaleTimeString(),
    }));

    return (
        <div style={{ marginBottom: "24px" }}>
            <h4 style={{ marginBottom: "8px" }}>{title}</h4>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {metrics.map((m) => (
                        <Line
                            key={m.key}
                            type="monotone"
                            dataKey={m.key}
                            name={m.name}
                            stroke={m.color}
                            dot={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}