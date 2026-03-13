import { Link } from "react-router-dom";
import type { Turbine } from "../mocks/mockData";

interface TurbineCardProps {
    turbine: Turbine;
}

export default function TurbineCard({ turbine }: TurbineCardProps) {
    const isRunning = turbine.status === "running";

    return (
        <div className={`card bg-base-100 shadow-md border-t-4 ${isRunning ? 'border-t-success' : 'border-t-error'} transition-all hover:-translate-y-1 hover:shadow-xl`}>
            <div className="card-body p-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="card-title text-lg font-bold">{turbine.name}</h2>
                        <p className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">ID: {turbine.id}</p>
                    </div>
                    <div className={`badge badge-sm ${isRunning ? "badge-success text-success-content" : "badge-error text-error-content"}`}>
                        {turbine.status}
                    </div>
                </div>

                {/* Location Info */}
                <div className="mt-4 flex items-center gap-2 text-sm text-base-content/70">
                    <span className="text-lg">📍</span>
                    <span className="truncate">{turbine.location}</span>
                </div>

                {/* IoT Connection Placeholder */}
                <div className="mt-2 py-2 px-3 bg-base-200 rounded text-[11px] flex justify-between items-center">
                    <span className="opacity-60">Signal Strength</span>
                    <span className="text-success font-bold">Excellent</span>
                </div>

                {/* Action */}
                <div className="card-actions mt-6">
                    <Link
                        to={`/turbine/${turbine.id}`}
                        className={`btn btn-block btn-sm ${isRunning ? 'btn-outline border-base-300' : 'btn-primary'}`}
                    >
                        Inspect Turbine
                    </Link>
                </div>
            </div>
        </div>
    );
}