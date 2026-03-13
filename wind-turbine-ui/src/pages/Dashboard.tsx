import { useEffect, useState } from "react";
import TurbineCard from "../components/TurbineCard";
import Navbar from "../components/Navbar";
import { MockAPI } from "../mocks/mockApi";
import type { Turbine } from "../mocks/mockData";
import {ApiService} from "../api/apiService.ts";

export default function Dashboard() {
    const [turbines, setTurbines] = useState<Turbine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MockAPI.getTurbines()
            .then((data) => setTurbines(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        ApiService.getTurbines().then(data => {
            setTurbines(data);
        });
    }, []);

    // Summary calculations
    const activeCount = turbines.filter(t => t.status === "running").length;

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />

            <div className="container mx-auto p-6">
                {/* IoT Farm Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="badge badge-primary badge-outline font-mono text-xs">FARM-ID: f525fdb5-4455-4bce-a4ac-86a89bd3f103</div>
                            <div className="badge badge-ghost badge-outline text-xs">MQTT CONNECTED</div>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Wind Farm Overview</h1>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="stats shadow bg-base-100 border border-base-300">
                        <div className="stat py-2 px-4">
                            <div className="stat-title text-xs">Active Turbines</div>
                            <div className="stat-value text-2xl text-success">{activeCount}/4</div>
                        </div>
                        <div className="stat py-2 px-4 border-l border-base-300">
                            <div className="stat-title text-xs">System Health</div>
                            <div className="stat-value text-2xl">{activeCount === 4 ? "100%" : "75%"}</div>
                        </div>
                    </div>
                </div>

                {/* Fixed 4-Column Grid for exactly 4 turbines */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {turbines.map((t) => (
                        <TurbineCard key={t.id} turbine={t} />
                    ))}
                </div>
            </div>
        </div>
    );
}