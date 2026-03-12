namespace WindTurbineApi.Dtos;

public class TelemetryDto
{
    public string TurbineId { get; set; } = "";
    public string TurbineName { get; set; } = "";
    public string FarmId { get; set; } = "";

    public DateTime Timestamp { get; set; } = DateTime.Now;

    public double WindSpeed { get; set; } = 0.0;
    public double WindDirection { get; set; } = 0.0;

    public double AmbientTemperature { get; set; } = 0.0;

    public double RotorSpeed { get; set; } = 0.0;

    public double PowerOutput { get; set; }= 0.0;

    public double NacelleDirection { get; set; }= 0.0;

    public double BladePitch { get; set; }= 0.0;

    public double GeneratorTemp { get; set; }= 0.0;

    public double GearboxTemp { get; set; }= 0.0;

    public double Vibration { get; set; }= 0.0;

    public string Status { get; set; } = "";
}