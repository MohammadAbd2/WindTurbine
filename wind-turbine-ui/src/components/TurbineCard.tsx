import { Link } from "react-router-dom";
import type { TurbineViewModel } from "../types/api";

interface TurbineCardProps {
    turbine: TurbineViewModel;
}

export default function TurbineCard({ turbine }: TurbineCardProps) {
    const isRunning = turbine.status === "running";

    return (
        <div className={`card border-t-4 bg-base-100 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl ${isRunning ? "border-t-success" : "border-t-warning"}`}>
            <div className="card-body p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="card-title text-lg">{turbine.name}</h2>
                        <p className="font-mono text-[11px] uppercase tracking-wide text-base-content/50">
                            {turbine.id}
                        </p>
                    </div>
                    <div className={`badge ${isRunning ? "badge-success" : "badge-warning"}`}>
                        {turbine.status}
                    </div>
                </div>

                <div className="mt-4 text-sm text-base-content/70">
                    <p>{turbine.location}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-base-200 p-3">
                        <p className="text-base-content/50">Wind</p>
                        <p className="font-semibold">
                            {turbine.latestMetric ? `${turbine.latestMetric.windSpeed.toFixed(1)} m/s` : "No data"}
                        </p>
                    </div>
                    <div className="rounded-xl bg-base-200 p-3">
                        <p className="text-base-content/50">Power</p>
                        <p className="font-semibold">
                            {turbine.latestMetric ? `${turbine.latestMetric.powerOutput.toFixed(1)} kW` : "No data"}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-base-content/55">
                    <span>{turbine.alerts.length} recent alerts</span>
                    <span>
                        {turbine.latestMetric
                            ? new Date(turbine.latestMetric.timestamp).toLocaleTimeString()
                            : "Awaiting telemetry"}
                    </span>
                </div>

                <div className="card-actions mt-5">
                    <Link to={`/turbine/${turbine.id}`} className="btn btn-primary btn-sm w-full">
                        Open turbine
                    </Link>
                </div>
            </div>
        </div>
    );
}
