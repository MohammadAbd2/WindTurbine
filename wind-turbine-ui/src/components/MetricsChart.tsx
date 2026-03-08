import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export default function MetricsChart({ data }) {
    return (
        <LineChart width={800} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="windSpeed" stroke="#8884d8" />
            <Line type="monotone" dataKey="powerOutput" stroke="#82ca9d" />
        </LineChart>
    );
}