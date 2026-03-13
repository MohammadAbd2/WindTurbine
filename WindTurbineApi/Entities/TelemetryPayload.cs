using System.Text.Json.Serialization;

namespace WindTurbineApi.Entities;

public class TelemetryPayload
{
    [JsonPropertyName("turbineId")]
    public string TurbineId { get; set; } = string.Empty;

    [JsonPropertyName("turbineName")]
    public string TurbineName { get; set; } = string.Empty;

    [JsonPropertyName("farmId")]
    public string FarmId { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("windSpeed")]
    public double WindSpeed { get; set; }

    [JsonPropertyName("ambientTemperature")]
    public double AmbientTemperature { get; set; }

    [JsonPropertyName("powerOutput")]
    public double PowerOutput { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}