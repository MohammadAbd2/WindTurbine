import axios from "axios";
import type {
    AlertsSnapshot,
    ApiAlert,
    ApiMetric,
    ApiTurbine,
    MetricsSnapshot,
    TurbineCommand,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5199";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const ApiService = {
    async getTurbines(): Promise<ApiTurbine[]> {
        const response = await api.get<ApiTurbine[]>("/api/turbines");
        return response.data;
    },

    async getTurbineById(turbineId: string): Promise<ApiTurbine> {
        const response = await api.get<ApiTurbine>(`/api/turbines/${turbineId}`);
        return response.data;
    },

    async getMetrics(turbineId: string): Promise<ApiMetric[]> {
        const response = await api.get<ApiMetric[]>(`/api/turbines/${turbineId}/metrics`);
        return response.data;
    },

    async getAlerts(turbineId: string): Promise<ApiAlert[]> {
        const response = await api.get<ApiAlert[]>(`/api/turbines/${turbineId}/alerts`);
        return response.data;
    },

    async sendCommand(turbineId: string, command: TurbineCommand) {
        const response = await api.post(`/api/turbines/${turbineId}/commands`, command);
        return response.data as { status: string; topic: string };
    },
};

export function createSseConnection<T>(path: string, onMessage: (payload: T) => void, onError?: () => void) {
    const source = new EventSource(`${API_BASE_URL}${path}`);
    source.onmessage = (event) => {
        try {
            onMessage(JSON.parse(event.data) as T);
        } catch (error) {
            console.error(`Failed to parse SSE payload from ${path}`, error);
        }
    };
    source.onerror = () => {
        onError?.();
    };
    return source;
}

export function connectMetricsStream(
    turbineId: string | null,
    onMessage: (payload: MetricsSnapshot) => void,
    onError?: () => void,
) {
    const query = turbineId ? `?turbineId=${encodeURIComponent(turbineId)}` : "";
    return createSseConnection<MetricsSnapshot>(`/sse/metrics${query}`, onMessage, onError);
}

export function connectAlertsStream(
    turbineId: string | null,
    onMessage: (payload: AlertsSnapshot) => void,
    onError?: () => void,
) {
    const query = turbineId ? `?turbineId=${encodeURIComponent(turbineId)}` : "";
    return createSseConnection<AlertsSnapshot>(`/sse/alerts${query}`, onMessage, onError);
}
