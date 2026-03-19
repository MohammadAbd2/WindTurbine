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
    private readonly JsonSerializerOptions _options = new() 
    { 
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString 
    };

    // 1. استقبال بيانات التوربينات (Telemetry)
    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry")]
    public async Task HandleTelemetry(string topic, string payload)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        try 
        {
            var data = JsonSerializer.Deserialize<TelemetryPayload>(payload, _options);
            if (data == null) return;

            var turbine = await db.Turbines.FirstOrDefaultAsync(t => t.Id == data.TurbineId);
            if (turbine == null)
            {
                turbine = new Turbine { Id = data.TurbineId, Name = data.TurbineName ?? "Unknown", Location = "Offshore" };
                db.Turbines.Add(turbine);
            }

            var metric = new TurbineMetric
            {
                Id = Guid.NewGuid().ToString(),
                TurbineId = data.TurbineId,
                WindSpeed = data.WindSpeed,
                Temperature = data.AmbientTemperature,
                PowerOutput = data.PowerOutput,
                Timestamp = data.Timestamp.ToUniversalTime()
            };

            db.TurbineMetrics.Add(metric);
            await db.SaveChangesAsync();

            // تصحيح: تمرير اسم المجموعة والبيانات للدالة
            await backplane.Clients.SendToGroupAsync("telemetry-updates", metric);
            
            Console.WriteLine($"[MQTT Telemetry] Saved & Broadcasted for: {data.TurbineId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error Telemetry]: {ex.Message}");
        }
    }

    // 2. استقبال التنبيهات (Alerts)
    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/alert")]
    public async Task HandleAlert(string topic, string payload)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        try
        {
            var alertData = JsonSerializer.Deserialize<MqttAlertPayload>(payload, _options);
            if (alertData == null) return;

            var alertEntity = new Alert
            {
                Id = Guid.NewGuid().ToString(),
                TurbineId = alertData.TurbineId,
                Message = $"[{alertData.Severity.ToUpper()}] {alertData.Message}",
                Timestamp = alertData.Timestamp.Kind == DateTimeKind.Unspecified 
                            ? DateTime.SpecifyKind(alertData.Timestamp, DateTimeKind.Utc) 
                            : alertData.Timestamp.ToUniversalTime()
            };

            db.Alerts.Add(alertEntity);
            await db.SaveChangesAsync();
            
            // إرسال التنبيه عبر SSE للمشتركين في مجموعة alerts
            await backplane.Clients.SendToGroupAsync("alerts-updates", alertEntity);
            
            Console.WriteLine($"[Alert Saved & Broadcasted] ID: {alertData.TurbineId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Database Error] Alert save failed: {ex.Message}");
        }
    }
}

// --- تحويل الخصائص إلى 'init' لحل تحذيرات Property can be made init-only ---

public class MqttAlertPayload
{
    [JsonPropertyName("turbineId")]
    public string TurbineId { get; init; } = string.Empty;

    [JsonPropertyName("farmId")]
    public string FarmId { get; init; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; init; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; init; }
}

public class TelemetryPayload
{
    public string TurbineId { get; init; } = string.Empty;
    public string? TurbineName { get; init; }
    public double WindSpeed { get; init; }
    public double AmbientTemperature { get; init; }
    public double PowerOutput { get; init; }
    public DateTime Timestamp { get; init; }
}