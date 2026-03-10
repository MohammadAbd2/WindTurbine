import { Link } from "react-router-dom";
import type { Turbine } from "../mocks/mockData";

interface TurbineCardProps {
    turbine: Turbine;
}

const statusColors: Record<Turbine["status"], string> = {
    running: "#52c41a",
    stopped: "#ff4d4f",
};

export default function TurbineCard({ turbine }: TurbineCardProps) {
    return (
        <div
            style={{
                border: "1px solid #d9d9d9",
                borderRadius: "8px",
                padding: "20px",
                minWidth: "200px",
                backgroundColor: "#fafafa",
            }}
        >
            <h3 style={{ margin: "0 0 8px 0" }}>{turbine.name}</h3>
            <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                📍 {turbine.location}
            </p>
            <p style={{ margin: "0 0 16px 0" }}>
                Status:{" "}
                <span
                    style={{
                        color: statusColors[turbine.status],
                        fontWeight: "bold",
                        textTransform: "capitalize",
                    }}
                >
                    ● {turbine.status}
                </span>
            </p>
            <Link to={`/turbine/${turbine.id}`}>View Details →</Link>
        </div>
    );
}