using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;
using StateleSSE.AspNetCore;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;

public class TurbineMqttController(IServiceScopeFactory scopeFactory, ISseBackplane backplane) : MqttController
{
    // I keep these JSON options here because MQTT payloads can arrive with different casing and sometimes numeric values as strings.
    private readonly JsonSerializerOptions _options = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry")]
    public async Task HandleTelemetry(string topic, string payload)
    {
        // I create a scope per MQTT message so I can safely resolve DbContext for each incoming event.
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        try
        {
            // I deserialize the raw MQTT payload into the telemetry model the backend expects.
            var data = JsonSerializer.Deserialize<TelemetryPayload>(payload, _options);
            if (data == null)
            {
                return;
            }

            // If the turbine does not exist yet, I create it the first time telemetry arrives.
            var turbine = await db.Turbines.FirstOrDefaultAsync(t => t.Id == data.TurbineId);
            if (turbine == null)
            {
                turbine = new Turbine
                {
                    Id = data.TurbineId,
                    Name = string.IsNullOrWhiteSpace(data.TurbineName) ? "Unknown" : data.TurbineName,
                    Location = "Offshore"
                };
                db.Turbines.Add(turbine);
            }

            // Each telemetry message becomes a metric row, which makes it easy to query history later for charts and snapshots.
            var metric = new TurbineMetric
            {
                Id = Guid.NewGuid().ToString(),
                TurbineId = data.TurbineId,
                WindSpeed = data.WindSpeed,
                Temperature = data.AmbientTemperature,
                PowerOutput = data.PowerOutput,
                Timestamp = data.Timestamp.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(data.Timestamp, DateTimeKind.Utc)
                    : data.Timestamp.ToUniversalTime()
            };

            db.TurbineMetrics.Add(metric);
            await db.SaveChangesAsync();
            // After saving, I broadcast both the turbine snapshot and the fleet snapshot so the UI updates in real time.
            await BroadcastSnapshotAsync(db, data.TurbineId);

            Console.WriteLine($"[MQTT Telemetry] Saved & broadcast for turbine {data.TurbineId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MQTT Telemetry Error] {ex.Message}");
        }
    }

    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/alert")]
    public async Task HandleAlert(string topic, string payload)
    {
        // Alerts follow the same scoped pattern, but they are stored in the alerts table instead of metrics.
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        try
        {
            // Here I deserialize the MQTT alert payload and stop early if it cannot be parsed.
            var alertData = JsonSerializer.Deserialize<MqttAlertPayload>(payload, _options);
            if (alertData == null)
            {
                return;
            }

            // I prefix the message with severity so the stored alert still carries enough information before it is normalized for SSE.
            var alertEntity = new Alert
            {
                Id = Guid.NewGuid().ToString(),
                TurbineId = alertData.TurbineId,
                Message = $"[{alertData.Severity.ToUpperInvariant()}] {alertData.Message}",
                Timestamp = alertData.Timestamp.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(alertData.Timestamp, DateTimeKind.Utc)
                    : alertData.Timestamp.ToUniversalTime()
            };

            db.Alerts.Add(alertEntity);
            await db.SaveChangesAsync();
            // I update metric snapshots too because the metrics stream response includes a small list of recent alerts.
            await BroadcastSnapshotAsync(db, alertData.TurbineId);
            await BroadcastAlertSnapshotAsync(db, alertData.TurbineId);

            Console.WriteLine($"[MQTT Alert] Saved & broadcast for turbine {alertData.TurbineId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MQTT Alert Error] {ex.Message}");
        }
    }

    private async Task BroadcastSnapshotAsync(WindTurbineDbContext db, string turbineId)
    {
        // I build one snapshot for the selected turbine and one for the full fleet so both screens stay in sync.
        var turbineSnapshot = await TurbineSseController.BuildSnapshotAsync(db, turbineId, CancellationToken.None);
        await backplane.Clients.SendToGroupAsync(TurbineSseController.BuildMetricsGroupName(turbineId), turbineSnapshot);

        var fleetSnapshot = await TurbineSseController.BuildSnapshotAsync(db, null, CancellationToken.None);
        await backplane.Clients.SendToGroupAsync(TurbineSseController.BuildMetricsGroupName(null), fleetSnapshot);
    }

    private async Task BroadcastAlertSnapshotAsync(WindTurbineDbContext db, string turbineId)
    {
        // Same idea here, but for the dedicated alerts stream groups.
        var turbineAlerts = await TurbineSseController.BuildAlertsSnapshotAsync(db, turbineId, CancellationToken.None);
        await backplane.Clients.SendToGroupAsync(TurbineSseController.BuildAlertsGroupName(turbineId), turbineAlerts);

        var fleetAlerts = await TurbineSseController.BuildAlertsSnapshotAsync(db, null, CancellationToken.None);
        await backplane.Clients.SendToGroupAsync(TurbineSseController.BuildAlertsGroupName(null), fleetAlerts);
    }
}
