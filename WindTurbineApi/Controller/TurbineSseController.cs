using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;

[ApiController]
[Route("sse")]
public class TurbineSseController(
    WindTurbineDbContext db,
    ISseBackplane backplane
) : ControllerBase
{
    // I keep the farm id here so the streamed alert DTOs always include the same farm reference.
    private const string FarmId = "6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7";
    public const string MetricsGroup = "turbine-metrics";
    public const string AlertsGroup = "turbine-alerts";
    // I poll every few seconds so a new client also gets fresh data even if MQTT has not published right away.
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    [HttpGet("metrics")]
    public async Task Metrics([FromQuery] string? turbineId, CancellationToken ct)
    {
        // I build a group name based on the turbine id, so one endpoint can support both fleet view and single turbine view.
        var groupName = BuildMetricsGroupName(turbineId);
        await using var connection = backplane.CreateConnection();
        await connection.JoinGroupAsync(groupName);

        // I start a background publisher here so the stream keeps sending the latest snapshot on an interval.
        using var publishCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        var publishTask = PublishSnapshotsAsync(groupName, turbineId, publishCts.Token);

        await using var stream = await HttpContext.OpenSseStreamAsync(cancellationToken: ct);
        try
        {
            // Everything that reaches the backplane group is forwarded to the connected SSE client.
            await foreach (var sseEvent in connection.ReadAllAsync(ct))
            {
                await stream.WriteAsync(sseEvent.Data, ct);
            }
        }
        finally
        {
            // When the client disconnects I stop the publisher loop as well, so I do not keep work running unnecessarily.
            publishCts.Cancel();
            try
            {
                await publishTask;
            }
            catch (OperationCanceledException)
            {
            }
        }
    }

    [HttpGet("alerts")]
    public async Task Alerts([FromQuery] string? turbineId, CancellationToken ct)
    {
        // Same idea as metrics, but this endpoint only streams alert snapshots.
        var groupName = BuildAlertsGroupName(turbineId);
        await using var connection = backplane.CreateConnection();
        await connection.JoinGroupAsync(groupName);

        using var publishCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        var publishTask = PublishAlertsAsync(groupName, turbineId, publishCts.Token);

        await using var stream = await HttpContext.OpenSseStreamAsync(cancellationToken: ct);
        try
        {
            await foreach (var sseEvent in connection.ReadAllAsync(ct))
            {
                await stream.WriteAsync(sseEvent.Data, ct);
            }
        }
        finally
        {
            publishCts.Cancel();
            try
            {
                await publishTask;
            }
            catch (OperationCanceledException)
            {
            }
        }
    }

    internal static async Task<MetricsSnapshotResponse> BuildSnapshotAsync(
        WindTurbineDbContext db,
        string? turbineId,
        CancellationToken ct)
    {
        // I start from the newest rows first because the UI only needs the latest window of data.
        var metricsQuery = db.TurbineMetrics
            .AsNoTracking()
            .OrderByDescending(metric => metric.Timestamp);

        var alertsQuery = db.Alerts
            .AsNoTracking()
            .OrderByDescending(alert => alert.Timestamp);

        if (!string.IsNullOrWhiteSpace(turbineId))
        {
            // If a turbine id is provided, I narrow both queries so the stream becomes turbine-specific.
            metricsQuery = metricsQuery.Where(metric => metric.TurbineId == turbineId)
                .OrderByDescending(metric => metric.Timestamp);

            alertsQuery = alertsQuery.Where(alert => alert.TurbineId == turbineId)
                .OrderByDescending(alert => alert.Timestamp);
        }

        var metrics = await metricsQuery
            .Take(15)
            // I project directly to DTOs here so the stream payload stays small and only contains what the frontend uses.
            .Select(metric => new MetricDto(
                metric.Id,
                metric.TurbineId,
                metric.WindSpeed,
                metric.Temperature,
                metric.PowerOutput,
                metric.Timestamp))
            .ToListAsync(ct);

        var alerts = await alertsQuery
            .Take(5)
            .Select(alert => new AlertDto(
                alert.Id,
                alert.TurbineId,
                alert.Message,
                alert.Timestamp))
            .ToListAsync(ct);

        return new MetricsSnapshotResponse(metrics, alerts);
    }

    internal static string BuildMetricsGroupName(string? turbineId) =>
        // No turbine id means the fleet dashboard group, otherwise I create a per-turbine group.
        string.IsNullOrWhiteSpace(turbineId) ? MetricsGroup : $"{MetricsGroup}:{turbineId}";

    internal static string BuildAlertsGroupName(string? turbineId) =>
        string.IsNullOrWhiteSpace(turbineId) ? AlertsGroup : $"{AlertsGroup}:{turbineId}";

    internal static async Task<AlertsSnapshotResponse> BuildAlertsSnapshotAsync(
        WindTurbineDbContext db,
        string? turbineId,
        CancellationToken ct)
    {
        var alertsQuery = db.Alerts
            .AsNoTracking()
            .OrderByDescending(alert => alert.Timestamp);

        if (!string.IsNullOrWhiteSpace(turbineId))
        {
            alertsQuery = alertsQuery.Where(alert => alert.TurbineId == turbineId)
                .OrderByDescending(alert => alert.Timestamp);
        }

        var alerts = await alertsQuery
            .Take(20)
            .Select(alert => ToAlertDto(alert.Id, alert.TurbineId, alert.Message, alert.Timestamp))
            .ToListAsync(ct);

        return new AlertsSnapshotResponse(alerts);
    }

    private async Task PublishSnapshotsAsync(string groupName, string? turbineId, CancellationToken ct)
    {
        // I send one snapshot immediately so the client does not have to wait for the first timer tick.
        await BroadcastMetricsSnapshotAsync(groupName, turbineId, ct);

        using var timer = new PeriodicTimer(PollInterval);
        while (await timer.WaitForNextTickAsync(ct))
        {
            await BroadcastMetricsSnapshotAsync(groupName, turbineId, ct);
        }
    }

    private async Task PublishAlertsAsync(string groupName, string? turbineId, CancellationToken ct)
    {
        // Same immediate push here, but for alerts.
        await BroadcastAlertsSnapshotAsync(groupName, turbineId, ct);

        using var timer = new PeriodicTimer(PollInterval);
        while (await timer.WaitForNextTickAsync(ct))
        {
            await BroadcastAlertsSnapshotAsync(groupName, turbineId, ct);
        }
    }

    private async Task BroadcastMetricsSnapshotAsync(string groupName, string? turbineId, CancellationToken ct)
    {
        var payload = await BuildSnapshotAsync(db, turbineId, ct);
        await backplane.Clients.SendToGroupAsync(groupName, payload);
    }

    private async Task BroadcastAlertsSnapshotAsync(string groupName, string? turbineId, CancellationToken ct)
    {
        var payload = await BuildAlertsSnapshotAsync(db, turbineId, ct);
        await backplane.Clients.SendToGroupAsync(groupName, payload);
    }

    private static AlertStreamDto ToAlertDto(string id, string turbineId, string? message, DateTime timestamp)
    {
        // I normalize the alert text here so the frontend can style by severity without parsing every message again.
        var severity = "info";
        var normalizedMessage = message ?? string.Empty;

        if (normalizedMessage.StartsWith("[CRITICAL] ", StringComparison.OrdinalIgnoreCase))
        {
            severity = "critical";
            normalizedMessage = normalizedMessage[11..];
        }
        else if (normalizedMessage.StartsWith("[WARNING] ", StringComparison.OrdinalIgnoreCase))
        {
            severity = "warning";
            normalizedMessage = normalizedMessage[10..];
        }
        else if (normalizedMessage.StartsWith("[INFO] ", StringComparison.OrdinalIgnoreCase))
        {
            normalizedMessage = normalizedMessage[7..];
        }

        return new AlertStreamDto(id, turbineId, FarmId, severity, normalizedMessage, timestamp);
    }

    internal sealed record MetricsSnapshotResponse(
        IReadOnlyList<MetricDto> Metrics,
        IReadOnlyList<AlertDto> Alerts);

    internal sealed record MetricDto(
        string Id,
        string TurbineId,
        double WindSpeed,
        double Temperature,
        double PowerOutput,
        DateTime Timestamp);

    internal sealed record AlertDto(
        string Id,
        string TurbineId,
        string? Message,
        DateTime Timestamp);

    internal sealed record AlertsSnapshotResponse(
        IReadOnlyList<AlertStreamDto> Alerts);

    internal sealed record AlertStreamDto(
        string Id,
        string TurbineId,
        string FarmId,
        string Severity,
        string Message,
        DateTime Timestamp);
}
