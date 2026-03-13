import { useEffect, useState } from "react";
import { MockAPI, subscribeToAlerts } from "../mocks/mockApi";
import type { TurbineAlert } from "../mocks/mockData";
import { ApiService, getSSEConnection } from "../api/apiService";

interface AlertsPanelProps {
    turbineId: string;
}

// Using DaisyUI text and border colors for a cleaner look
const severityStyles: Record<TurbineAlert["severity"], { border: string; text: string; bg: string }> = {
    critical: { border: "border-l-error", text: "text-error", bg: "bg-error/5" },
    warning: { border: "border-l-warning", text: "text-warning", bg: "bg-warning/5" },
    info: { border: "border-l-info", text: "text-info", bg: "bg-info/5" },
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

    useEffect(() => {
        // 1. جلب التنبيهات القديمة من قاعدة البيانات عبر Swagger
        ApiService.getAlerts(turbineId)
            .then(data => {
                if (data && data.length > 0) setAlerts(data);
                else MockAPI.getAlerts(turbineId).then(setAlerts); // Fallback للموك
            })
            .catch(() => MockAPI.getAlerts(turbineId).then(setAlerts));

        // 2. الاستماع للتنبيهات الحية عبر SSE
        const sse = getSSEConnection(`/sse/alerts?turbineId=${turbineId}`);

        sse.onmessage = (event) => {
            const newAlert = JSON.parse(event.data);
            setAlerts((prev) => [newAlert, ...prev].slice(0, 20));
        };

        return () => sse.close(); // إغلاق الاتصال عند الخروج
    }, [turbineId]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">⚠️ System Alerts</h2>
                <span className="badge badge-outline opacity-70">{alerts.length} Total</span>
            </div>

            {/* Scrollable Container with fixed height */}
            <div className="overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: "400px" }}>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-base-content/40">
                        <span className="text-4xl mb-2">✅</span>
                        <p>All systems nominal. No alerts.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {alerts.map((alert) => {
                            const style = severityStyles[alert.severity];
                            return (
                                <div
                                    key={alert.id}
                                    className={`flex flex-col p-3 rounded-r-md border-l-4 ${style.border} ${style.bg} transition-all hover:bg-base-200`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
                                            {alert.severity}
                                        </span>
                                        <span className="text-[10px] opacity-60 font-mono">
                                            {new Date(alert.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-base-content/90">
                                        {alert.message}
                                    </p>
                                    <p className="text-[10px] opacity-50 mt-1">
                                        {new Date(alert.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {alerts.length > 0 && (
                <div className="mt-4 pt-2 border-t border-base-200 text-center">
                    <button
                        className="btn btn-ghost btn-xs text-base-content/40"
                        onClick={() => setAlerts([])}
                    >
                        Clear View (Local)
                    </button>
                </div>
            )}
        </div>
    );
}