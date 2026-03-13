using System.Text.Json;
using System.Text.Json.Serialization; // ضروري لـ JsonPropertyName
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;

public class TurbineMqttController(IServiceScopeFactory scopeFactory) : MqttController
{
    private readonly JsonSerializerOptions _options = new() { PropertyNameCaseInsensitive = true };

    // 1. استقبال بيانات التوربينات (Telemetry)
    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry")]
    public async Task HandleTelemetry(string topic, string payload)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        var data = JsonSerializer.Deserialize<TelemetryPayload>(payload, _options);
        if (data == null) return;

        var turbine = await db.Turbines.FirstOrDefaultAsync(t => t.Id == data.TurbineId);
        if (turbine == null)
        {
            turbine = new Turbine { Id = data.TurbineId, Name = data.TurbineName ?? "Unknown", Location = "Offshore" };
            db.Turbines.Add(turbine);
        }

        db.TurbineMetrics.Add(new TurbineMetric
        {
            Id = Guid.NewGuid().ToString(),
            TurbineId = data.TurbineId,
            WindSpeed = data.WindSpeed,
            Temperature = data.AmbientTemperature,
            PowerOutput = data.PowerOutput,
            Timestamp = data.Timestamp.ToUniversalTime()
        });

        await db.SaveChangesAsync();
        // حل مشكلة Ambiguous invocation عبر تحويل القيمة لنص صريح
        Console.WriteLine("[MQTT] Telemetry saved for: " + data.TurbineId.ToString());
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

            db.Alerts.Add(new Alert
            {
                Id = Guid.NewGuid().ToString(),
                TurbineId = alertData.TurbineId,
                // الآن حقل Severity موجود ولن يعطي خطأ
                Message = "[" + (alertData.Severity?.ToUpper() ?? "INFO") + "] " + alertData.Message,
                Timestamp = alertData.Timestamp.ToUniversalTime()
            });

            await db.SaveChangesAsync();
            Console.WriteLine("[Alert Saved] From: " + alertData.TurbineId.ToString());
        }
        catch (Exception ex)
        {
            Console.WriteLine("[Error] MQTT Alert: " + ex.Message);
        }
    }
} // <--- هذا هو القوس الذي كان ناقصاً لإغلاق الكلاس

// DTOs (يمكن وضعها في ملفات منفصلة أو أسفل الملف)
public class MqttAlertPayload
{
    [JsonPropertyName("turbineId")]
    public string TurbineId { get; init; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; init; } = string.Empty; // أضفنا هذا الحقل لحل مشكلة Resolve Severity

    [JsonPropertyName("message")]
    public string Message { get; init; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; init; }
}