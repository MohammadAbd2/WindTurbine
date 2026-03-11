import { useEffect, useState } from "react";
import TurbineCard from "../components/TurbineCard";
import { MockAPI } from "../mocks/mockApi";
import { useAuth } from "../auth/AuthContext";
import type { Turbine } from "../mocks/mockData";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [turbines, setTurbines] = useState<Turbine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MockAPI.getTurbines()
            .then((data) => setTurbines(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div>Loading turbines...</div>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h1 style={{ margin: 0 }}>Wind Turbine Dashboard</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: "#666" }}>
                        👤 {user?.username} ({user?.role})
                    </span>
                    <button
                        onClick={logout}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #d9d9d9",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {turbines.map((t) => (
                    <TurbineCard key={t.id} turbine={t} />
                ))}
            </div>
        </div>
    );
}