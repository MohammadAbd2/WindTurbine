using System.Text.Json.Serialization;

namespace WindTurbineApi.Entities;

public class MqttAlertPayload
{
    [JsonPropertyName("turbineId")]
    public string TurbineId { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = string.Empty; // warning, critical, etc.

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}