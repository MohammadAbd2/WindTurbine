import { useEffect, useState } from "react";
import API from "../api/api.tsx";
import TurbineCard from "../components/TurbineCard";

export default function Dashboard() {
    const [turbines, setTurbines] = useState([]);

    useEffect(() => {
        API.get("/turbines")
            .then((res) => setTurbines(res.data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div>
            <h1>Wind Turbine Dashboard</h1>
            <div style={{ display: "flex", gap: "20px" }}>
                {turbines.map((t) => (
                    <TurbineCard key={t.id} turbine={t} />
                ))}
            </div>
        </div>
    );
}