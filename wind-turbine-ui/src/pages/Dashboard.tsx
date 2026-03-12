import { useEffect, useState } from "react";
import TurbineCard from "../components/TurbineCard";
import ThemeSelector from "../components/ThemeSelector";
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
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <span className="text-xl font-bold px-4">🌬️ Wind Turbine Monitor</span>
                </div>
                <div className="flex-none gap-4 px-4">
                    <ThemeSelector />
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            👤 {user?.username} <span className="badge badge-sm">{user?.role}</span>
                        </span>
                        <button onClick={logout} className="btn btn-ghost btn-sm">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Turbine Overview</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {turbines.map((t) => (
                        <TurbineCard key={t.id} turbine={t} />
                    ))}
                </div>
            </div>
        </div>
    );
}