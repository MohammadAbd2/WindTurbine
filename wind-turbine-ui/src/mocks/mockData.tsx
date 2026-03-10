// ============ CONSTANTS ============
export const FARM_ID = "f525fdb5-4455-4bce-a4ac-86a89bd3f103";

// ============ TYPES ============
export interface Turbine {
    id: string;
    name: string;
    location: string;
    status: "running" | "stopped";
}

// Matches the real MQTT telemetry payload
export interface Telemetry {
    turbineId: string;
    turbineName: string;
    farmId: string;
    timestamp: string;
    windSpeed: number;
    windDirection: number;
    ambientTemperature: number;
    rotorSpeed: number;
    powerOutput: number;
    nacelleDirection: number;
    bladePitch: number;
    generatorTemp: number;
    gearboxTemp: number;
    vibration: number;
    status: "running" | "stopped";
}

// Matches the real MQTT alert payload
export interface TurbineAlert {
    id: string; // Added for React keys (backend should generate)
    turbineId: string;
    farmId: string;
    timestamp: string;
    severity: "warning" | "critical" | "info";
    message: string;
}

// Command types matching the MQTT contract
export type TurbineCommand =
    | { action: "start" }
    | { action: "stop"; reason?: string }
    | { action: "setInterval"; value: number }
    | { action: "setPitch"; angle: number };

// ============ MOCK DATA ============
export const mockTurbines: Turbine[] = [
    { id: "turbine-alpha", name: "Alpha", location: "North Platform", status: "running" },
    { id: "turbine-beta", name: "Beta", location: "North Platform", status: "running" },
    { id: "turbine-gamma", name: "Gamma", location: "South Platform", status: "stopped" },
    { id: "turbine-delta", name: "Delta", location: "East Platform", status: "running" },
];

// Alert messages that might come from the IoT system
const alertMessages = [
    "Generator temperature elevated",
    "Vibration levels above normal",
    "Wind speed approaching threshold",
    "Gearbox temperature warning",
    "Blade pitch adjustment recommended",
    "Rotor speed fluctuation detected",
];

export const mockAlerts: TurbineAlert[] = [
    {
        id: "alert-1",
        turbineId: "turbine-alpha",
        farmId: FARM_ID,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: "warning",
        message: "Generator temperature elevated",
    },
    {
        id: "alert-2",
        turbineId: "turbine-gamma",
        farmId: FARM_ID,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        severity: "critical",
        message: "Turbine stopped - maintenance required",
    },
    {
        id: "alert-3",
        turbineId: "turbine-beta",
        farmId: FARM_ID,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        severity: "info",
        message: "Scheduled maintenance in 7 days",
    },
];

// ============ GENERATORS ============
export function generateTelemetry(turbine: Turbine): Telemetry {
    const isRunning = turbine.status === "running";
    
    return {
        turbineId: turbine.id,
        turbineName: turbine.name,
        farmId: FARM_ID,
        timestamp: new Date().toISOString(),
        windSpeed: round(5 + Math.random() * 13),           // 5-18 m/s
        windDirection: round(Math.random() * 360),          // 0-360°
        ambientTemperature: round(5 + Math.random() * 20),  // 5-25°C
        rotorSpeed: isRunning ? round(8 + Math.random() * 12) : 0,    // 8-20 rpm
        powerOutput: isRunning ? round(500 + Math.random() * 2000) : 0, // 500-2500 kW
        nacelleDirection: round(Math.random() * 360),       // 0-360°
        bladePitch: round(Math.random() * 30),              // 0-30°
        generatorTemp: isRunning ? round(35 + Math.random() * 45) : 20, // 35-80°C
        gearboxTemp: isRunning ? round(30 + Math.random() * 45) : 18,   // 30-75°C
        vibration: isRunning ? round(0.5 + Math.random() * 4) : 0,      // 0.5-4.5 mm/s
        status: turbine.status,
    };
}

export function generateTelemetryHistory(turbine: Turbine, count: number = 20): Telemetry[] {
    const history: Telemetry[] = [];
    const now = Date.now();

    for (let i = count - 1; i >= 0; i--) {
        const telemetry = generateTelemetry(turbine);
        telemetry.timestamp = new Date(now - i * 5000).toISOString(); // 5s intervals
        history.push(telemetry);
    }
    return history;
}

export function generateRandomAlert(turbineId: string): TurbineAlert {
    return {
        id: `alert-${Date.now()}`,
        turbineId,
        farmId: FARM_ID,
        timestamp: new Date().toISOString(),
        severity: Math.random() > 0.7 ? "critical" : "warning",
        message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
    };
}

// Helper
function round(value: number): number {
    return Math.round(value * 10) / 10;
}