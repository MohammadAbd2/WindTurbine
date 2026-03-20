import type { ApiAlert, ApiMetric, ApiStreamAlert, ApiTurbine, TurbineViewModel } from "../types/api";

export function normalizeAlertSeverity(message: string | null): ApiStreamAlert["severity"] {
    const normalized = (message ?? "").toUpperCase();
    if (normalized.startsWith("[CRITICAL]")) {
        return "critical";
    }
    if (normalized.startsWith("[WARNING]")) {
        return "warning";
    }
    return "info";
}

export function mapAlertEntityToStream(alert: ApiAlert): ApiStreamAlert {
    return {
        id: alert.id,
        turbineId: alert.turbineId,
        farmId: "6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7",
        severity: normalizeAlertSeverity(alert.message),
        message: stripSeverityPrefix(alert.message),
        timestamp: alert.timestamp,
    };
}

export function stripSeverityPrefix(message: string | null): string {
    return (message ?? "").replace(/^\[(CRITICAL|WARNING|INFO)\]\s*/i, "");
}

export function getLatestMetric(metrics: ApiMetric[]): ApiMetric | null {
    return metrics.length > 0 ? [...metrics].sort(sortMetricsDesc)[0] : null;
}

export function sortMetricsDesc(a: ApiMetric, b: ApiMetric) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function sortAlertsDesc<T extends { timestamp: string }>(a: T, b: T) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

export function deriveStatus(metric: ApiMetric | null): TurbineViewModel["status"] {
    return metric && metric.powerOutput > 0 ? "running" : "idle";
}

export function mapTurbineToViewModel(turbine: ApiTurbine): TurbineViewModel {
    const latestMetric = getLatestMetric(turbine.metrics);
    return {
        id: turbine.id,
        name: turbine.name,
        location: turbine.location,
        latestMetric,
        alerts: turbine.alerts.map(mapAlertEntityToStream).sort(sortAlertsDesc),
        status: deriveStatus(latestMetric),
    };
}
