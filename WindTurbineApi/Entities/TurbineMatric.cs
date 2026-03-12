namespace WindTurbineApi.Entities;

public class TurbineMetric
{
    public string Id { get; set; } = string.Empty;

    public string TurbineId { get; set; } = string.Empty;

    public Turbine Turbine { get; set; } = null!;

    public double WindSpeed { get; set; }

    public double Temperature { get; set; }

    public double PowerOutput { get; set; }

    public DateTime Timestamp { get; set; }
}