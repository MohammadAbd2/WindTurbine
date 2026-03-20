import type { ApiStreamAlert } from "../types/api";

interface AlertsPanelProps {
    alerts: ApiStreamAlert[];
}

const severityStyles: Record<ApiStreamAlert["severity"], { border: string; text: string; bg: string }> = {
    critical: { border: "border-l-error", text: "text-error", bg: "bg-error/5" },
    warning: { border: "border-l-warning", text: "text-warning", bg: "bg-warning/5" },
    info: { border: "border-l-info", text: "text-info", bg: "bg-info/5" },
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">System Alerts</h2>
                <span className="badge badge-outline opacity-70">{alerts.length} Total</span>
            </div>

            <div className="max-h-[420px] overflow-y-auto pr-2">
                {alerts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/60 px-6 py-10 text-center text-base-content/50">
                        No alerts received for this turbine.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {alerts.map((alert) => {
                            const style = severityStyles[alert.severity];
                            return (
                                <article
                                    key={alert.id}
                                    className={`rounded-r-xl border-l-4 ${style.border} ${style.bg} p-4`}
                                >
                                    <div className="mb-2 flex items-start justify-between gap-4">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
                                            {alert.severity}
                                        </span>
                                        <span className="font-mono text-[11px] text-base-content/50">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-base-content/90">{alert.message}</p>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
