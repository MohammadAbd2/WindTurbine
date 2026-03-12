import { useEffect, useState } from "react";
import { MockAPI, subscribeToAlerts } from "../mocks/mockApi";
import type { TurbineAlert } from "../mocks/mockData";

interface AlertsPanelProps {
    turbineId: string;
}

const severityClasses: Record<TurbineAlert["severity"], string> = {
    critical: "alert-error",
    warning: "alert-warning",
    info: "alert-info",
};

export default function AlertsPanel({ turbineId }: AlertsPanelProps) {
    const [alerts, setAlerts] = useState<TurbineAlert[]>([]);

    useEffect(() => {
        MockAPI.getAlerts(turbineId).then(setAlerts);

        const unsubscribe = subscribeToAlerts(turbineId, (newAlert) => {
            setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
        });

        return unsubscribe;
    }, [turbineId]);

    return (
        <div>
            <h2 className="card-title mb-4">⚠️ Alerts</h2>

            {alerts.length === 0 && (
                <p className="text-base-content/60">No alerts</p>
            )}

            <div className="flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className={`alert ${severityClasses[alert.severity]} py-2`}>
                        <div>
                            <span className="font-bold uppercase mr-2">{alert.severity}</span>
                            <span>{alert.message}</span>
                            <span className="text-xs ml-2 opacity-70">
                                {new Date(alert.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}