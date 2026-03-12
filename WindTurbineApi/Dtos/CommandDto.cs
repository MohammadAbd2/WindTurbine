using System.ComponentModel.DataAnnotations;

public class CommandDto
{
    public string CommandType { get; set; } = string.Empty;
    
    [Range(0, 90)]
    public double BladeAngle { get; set; }

    public bool BrakeEnabled { get; set; }

    [Range(0, 10000)]
    public double TargetPowerOutput { get; set; }
    
    
}