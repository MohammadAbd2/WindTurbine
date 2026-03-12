namespace WindTurbineApi.Entities;

public class OperatorCommand
{
    public Guid Id { get; set; }

    public string TurbineId { get; set; }= string.Empty;

    public string CommandType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;

    public string ExecutedBy { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
}