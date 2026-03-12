using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Services;

public class TurbineDataFetcher : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HttpClient _http;

    public TurbineDataFetcher(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
        _http = new HttpClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 1️⃣ Fetch turbines data from website
                var turbinesUrl = "https://sea-fullstack.web.app/farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/{turbineId}/telemetry";
                var telemetryList = await _http.GetFromJsonAsync<List<TurbineTelemetryDto>>(turbinesUrl, cancellationToken: stoppingToken);

                if (telemetryList != null && telemetryList.Count > 0)
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<WindTurbineDbContext>();

                    foreach (var t in telemetryList)
                    {
                        // Add Turbine if not exists
                        var turbine = await db.Turbines.FirstOrDefaultAsync(x => x.Id == t.TurbineId, stoppingToken);
                        if (turbine == null)
                        {
                            turbine = new Turbine
                            {
                                Id = t.TurbineId,
                                Name = t.TurbineName,
                                Location = "Unknown"
                            };
                            db.Turbines.Add(turbine);
                        }

                        // Add metrics
                        var metric = new TurbineMetric
                        {
                            TurbineId = t.TurbineId,
                            WindSpeed = t.WindSpeed,
                            Temperature = t.AmbientTemperature,
                            PowerOutput = t.PowerOutput,
                            Timestamp = t.Timestamp
                        };
                        db.TurbineMetrics.Add(metric);

                        // Add alert if exists
                        if (!string.IsNullOrEmpty(t.Status) && t.Status != "running")
                        {
                            db.Alerts.Add(new Alert
                            {
                                TurbineId = t.TurbineId,
                                Message = $"Status: {t.Status}",
                                Timestamp = t.Timestamp
                            });
                        }
                    }

                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching turbine data: {ex.Message}");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}

// DTO for telemetry JSON
public class TurbineTelemetryDto
{
    public string TurbineId { get; set; }
    public string TurbineName { get; set; }
    public string FarmId { get; set; }
    public DateTime Timestamp { get; set; }
    public double WindSpeed { get; set; }
    public double AmbientTemperature { get; set; }
    public double PowerOutput { get; set; }
    public string Status { get; set; }
}