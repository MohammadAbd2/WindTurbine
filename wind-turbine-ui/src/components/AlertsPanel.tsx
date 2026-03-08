import { useEffect, useState } from "react";
import API from "../api/api";

export default function AlertsPanel({ turbineId }) {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // 1️⃣ تحميل alerts القديمة من DB
        API.get(`/alerts?turbineId=${turbineId}`)
            .then((res) => setAlerts(res.data))
            .catch((err) => console.error(err));

        // 2️⃣ Realtime via SSE
        const eventSource = new EventSource(
            `http://localhost:5199/api/sse/alerts/${turbineId}`
        );

        eventSource.onmessage = (event) => {
            const newAlert = JSON.parse(event.data);
            setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
        };

        eventSource.onerror = () => {
            console.error("SSE connection failed");
            eventSource.close();
        };

        return () => eventSource.close();
    }, [turbineId]);

    const getSeverityStyle = (severity) => {
        switch (severity) {
            case "High":
                return { backgroundColor: "#ff4d4f", color: "white" };
            case "Medium":
                return { backgroundColor: "#faad14", color: "white" };
            case "Low":
                return { backgroundColor: "#52c41a", color: "white" };
            default:
                return { backgroundColor: "#d9d9d9" };
        }
    };

    return (
        <div style={{ marginTop: "30px" }}>
            <h3>Alerts</h3>

            {alerts.length === 0 && <p>No alerts</p>}

            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    style={{
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "6px",
                        ...getSeverityStyle(alert.severity),
                    }}
                >
                    <strong>{alert.severity}</strong>
                    <p>{alert.message}</p>
                    <small>
                        {new Date(alert.timestamp).toLocaleString()}
                    </small>
                </div>
            ))}
        </div>
    );
}