namespace WindTurbineApi.Entities;

public class Turbine
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    public ICollection<TurbineMetric> Metrics { get; set; } = new List<TurbineMetric>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}