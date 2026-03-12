import { Link } from "react-router-dom";
import type { Turbine } from "../mocks/mockData";

interface TurbineCardProps {
    turbine: Turbine;
}

export default function TurbineCard({ turbine }: TurbineCardProps) {
    const isRunning = turbine.status === "running";

    return (
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
                <h2 className="card-title">
                    {turbine.name}
                    <span className={`badge ${isRunning ? "badge-success" : "badge-error"}`}>
                        {turbine.status}
                    </span>
                </h2>
                <p className="text-base-content/60">📍 {turbine.location}</p>
                <div className="card-actions justify-end mt-4">
                    <Link to={`/turbine/${turbine.id}`} className="btn btn-primary btn-sm">
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    );
}