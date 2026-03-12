using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;
using System.Text.Json.Serialization; // مهم جداً

namespace WindTurbineApi.Controller;

public class TurbineMqttController : MqttController
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TurbineMqttController(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    [MqttRoute("farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/+/telemetry")]
    public async Task HandleMetric(string topic, string payload)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

        try
        {
            // إعدادات JSON لتجنب مشاكل حالة الأحرف (Case Sensitivity)
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var data = JsonSerializer.Deserialize<TelemetryPayload>(payload, options);

            if (data == null || string.IsNullOrEmpty(data.TurbineId))
            {
                Console.WriteLine("[Warning] Received empty or invalid payload");
                return;
            }

            // 1. التأكد من وجود التوربين أو إنشاؤه
            var turbine = await db.Turbines.FirstOrDefaultAsync(t => t.Id == data.TurbineId);
            if (turbine == null)
            {
                turbine = new Turbine 
                { 
                    Id = data.TurbineId, 
                    Name = data.TurbineName ?? "Unknown", 
                    Location = "Offshore" 
                };
                db.Turbines.Add(turbine);
                await db.SaveChangesAsync(); // حفظ التوربين أولاً
            }

            // 2. إضافة الميتريك
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

            // 3. إضافة Alert إذا لزم الأمر
            if (data.Status != "running")
            {
                db.Alerts.Add(new Alert
                {
                    Id = Guid.NewGuid().ToString(),
                    TurbineId = data.TurbineId,
                    Message = $"Status Alert: {data.Status}",
                    Timestamp = DateTime.UtcNow
                });
            }

            await db.SaveChangesAsync();
            Console.WriteLine($"[Success] Metric saved for: {data.TurbineId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] MQTT Processing: {ex.Message}");
        }
    }
}

// الـ DTO المتوافق مع JSON المحاكي
public class TelemetryPayload
{
    [JsonPropertyName("turbineId")]
    public string TurbineId { get; set; } = string.Empty;

    [JsonPropertyName("turbineName")]
    public string TurbineName { get; set; } = string.Empty;

    [JsonPropertyName("windSpeed")]
    public double WindSpeed { get; set; }

    [JsonPropertyName("ambientTemperature")]
    public double AmbientTemperature { get; set; }

    [JsonPropertyName("powerOutput")]
    public double PowerOutput { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}