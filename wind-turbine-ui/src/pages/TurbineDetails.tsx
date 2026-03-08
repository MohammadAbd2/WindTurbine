import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MetricsChart from "../components/MetricsChart";

export default function TurbineDetails() {
    const { id } = useParams();
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        const eventSource = new EventSource(
            `https://localhost:5001/api/sse/turbine/${id}`
        );

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMetrics((prev) => [...prev.slice(-20), data]);
        };

        return () => eventSource.close();
    }, [id]);

    return (
        <div>
            <h2>Turbine Details</h2>
            <MetricsChart data={metrics} />
        </div>
    );
}