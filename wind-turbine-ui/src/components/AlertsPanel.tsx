import { useEffect, useState } from "react";
import { MockAPI, subscribeToAlerts } from "../mocks/mockApi";
import type { TurbineAlert } from "../mocks/mockData";

interface AlertsPanelProps {
    turbineId: string;
}

const severityStyles: Record<TurbineAlert["severity"], React.CSSProperties> = {
    critical: { backgroundColor: "#ff4d4f", color: "white" },
    warning: { backgroundColor: "#faad14", color: "white" },
    info: { backgroundColor: "#1890ff", color: "white" },
};

export default function AlertsPanel({ turbineId }: AlertsPanelProps) {
    const [alerts, setAlerts] = useState<TurbineAlert[]>([]);

    useEffect(() => {
        // Load existing alerts
        MockAPI.getAlerts(turbineId).then(setAlerts);

        // Subscribe to new alerts
        const unsubscribe = subscribeToAlerts(turbineId, (newAlert) => {
            setAlerts((prev) => [newAlert, ...prev].slice(0, 20)); // Keep max 20
        });

        return unsubscribe;
    }, [turbineId]);

    return (
        <div style={{ marginTop: "30px" }}>
            <h3>⚠️ Alerts</h3>

            {alerts.length === 0 && <p style={{ color: "#666" }}>No alerts</p>}

            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    style={{
                        padding: "12px",
                        marginBottom: "10px",
                        borderRadius: "6px",
                        ...severityStyles[alert.severity],
                    }}
                >
                    <strong style={{ textTransform: "uppercase" }}>{alert.severity}</strong>
                    <p style={{ margin: "4px 0" }}>{alert.message}</p>
                    <small>{new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            ))}
        </div>
    );
}