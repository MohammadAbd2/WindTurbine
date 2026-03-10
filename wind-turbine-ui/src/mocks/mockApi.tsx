import {
    FARM_ID,
    mockTurbines,
    mockAlerts,
    generateTelemetry,
    generateTelemetryHistory,
    generateRandomAlert,
} from "./mockData";

import type {
    Turbine,
    Telemetry,
    TurbineAlert,
    TurbineCommand,
} from "./mockData";

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockAPI = {
    // Get all turbines
    async getTurbines(): Promise<Turbine[]> {
        await delay(300);
        return [...mockTurbines];
    },

    // Get single turbine
    async getTurbine(id: string): Promise<Turbine | undefined> {
        await delay(200);
        return mockTurbines.find((t) => t.id === id);
    },

    // Get alerts (optionally filtered by turbine)
    async getAlerts(turbineId?: string): Promise<TurbineAlert[]> {
        await delay(250);
        if (turbineId) {
            return mockAlerts.filter((a) => a.turbineId === turbineId);
        }
        return [...mockAlerts];
    },

    // Get telemetry history for charts
    async getTelemetryHistory(turbineId: string): Promise<Telemetry[]> {
        await delay(300);
        const turbine = mockTurbines.find((t) => t.id === turbineId);
        if (!turbine) return [];
        return generateTelemetryHistory(turbine, 20);
    },

    // Send command to turbine
    async sendCommand(
        turbineId: string,
        command: TurbineCommand
    ): Promise<{ success: boolean; message: string }> {
        await delay(400);
        
        // Log what would be sent to MQTT
        console.log(`[Mock] Sending to farm/${FARM_ID}/windmill/${turbineId}/command:`, command);
        
        // Simulate validation
        if (command.action === "setInterval" && (command.value < 1 || command.value > 60)) {
            return { success: false, message: "Interval must be between 1 and 60 seconds" };
        }
        if (command.action === "setPitch" && (command.angle < 0 || command.angle > 30)) {
            return { success: false, message: "Pitch angle must be between 0 and 30 degrees" };
        }

        return { success: true, message: `Command '${command.action}' sent successfully` };
    },
};

// ============ REALTIME SUBSCRIPTIONS (Simulates SSE) ============

// Subscribe to telemetry updates
export function subscribeToTelemetry(
    turbineId: string,
    onData: (telemetry: Telemetry) => void,
    intervalMs: number = 5000 // Real IoT sends every 5 seconds
): () => void {
    const turbine = mockTurbines.find((t) => t.id === turbineId);
    if (!turbine) {
        console.error(`[Mock SSE] Turbine ${turbineId} not found`);
        return () => {};
    }

    console.log(`[Mock SSE] Subscribed to telemetry for ${turbineId}`);

    const interval = setInterval(() => {
        onData(generateTelemetry(turbine));
    }, intervalMs);

    return () => {
        console.log(`[Mock SSE] Unsubscribed from telemetry for ${turbineId}`);
        clearInterval(interval);
    };
}

// Subscribe to alerts
export function subscribeToAlerts(
    turbineId: string,
    onAlert: (alert: TurbineAlert) => void,
    intervalMs: number = 15000
): () => void {
    console.log(`[Mock SSE] Subscribed to alerts for ${turbineId}`);

    const interval = setInterval(() => {
        // 25% chance of generating an alert
        if (Math.random() < 0.25) {
            onAlert(generateRandomAlert(turbineId));
        }
    }, intervalMs);

    return () => {
        console.log(`[Mock SSE] Unsubscribed from alerts for ${turbineId}`);
        clearInterval(interval);
    };
}