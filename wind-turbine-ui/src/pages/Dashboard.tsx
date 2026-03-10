import { useEffect, useState } from "react";
import TurbineCard from "../components/TurbineCard";
import { MockAPI } from "../mocks/mockApi";
import type { Turbine } from "../mocks/mockData";

export default function Dashboard() {
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
        <div>
            <h1>Wind Turbine Dashboard</h1>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {turbines.map((t) => (
                    <TurbineCard key={t.id} turbine={t} />
                ))}
            </div>
        </div>
    );
}