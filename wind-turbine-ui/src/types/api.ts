export interface ApiMetric {
    id: string;
    turbineId: string;
    windSpeed: number;
    temperature: number;
    powerOutput: number;
    timestamp: string;
}

export interface ApiAlert {
    id: string;
    turbineId: string;
    message: string | null;
    timestamp: string;
}

export interface ApiStreamAlert {
    id: string;
    turbineId: string;
    farmId: string;
    severity: "warning" | "critical" | "info";
    message: string;
    timestamp: string;
}

export interface ApiTurbine {
    id: string;
    name: string;
    location: string;
    metrics: ApiMetric[];
    alerts: ApiAlert[];
}

export interface MetricsSnapshot {
    metrics: ApiMetric[];
    alerts: ApiAlert[];
}

export interface AlertsSnapshot {
    alerts: ApiStreamAlert[];
}

export interface TurbineViewModel {
    id: string;
    name: string;
    location: string;
    latestMetric: ApiMetric | null;
    alerts: ApiStreamAlert[];
    status: "running" | "idle";
}

export type TurbineCommand =
    | { action: "start" }
    | { action: "stop"; reason?: string }
    | { action: "setInterval"; value: number }
    | { action: "setPitch"; angle: number };
