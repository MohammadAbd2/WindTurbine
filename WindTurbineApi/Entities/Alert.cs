namespace WindTurbineApi.Entities;

public class Alert 
{
    public string Id { get; set; }
    public string TurbineId { get; set; }
    public string Message { get; set; } = "";
    public DateTime Timestamp { get; set; }
}