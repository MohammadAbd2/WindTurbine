using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WindTurbineApi.Data;
using System.Text.Json;
using Mqtt.Controllers;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;
[Authorize]
[ApiController]
[Route("api/turbines/{turbineId}/commands")]
public class CommandController(WindTurbineDbContext db, IMqttClientService mqtt) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> SendCommand(string turbineId, [FromBody] CommandDto dto)
    {
        // 1. توثيق الأمر في قاعدة البيانات (حسب المتطلبات)
        var commandRecord = new OperatorCommand
        {
            Id = Guid.NewGuid(),
            TurbineId = turbineId,
            CommandType = dto.Action,
            Payload = JsonSerializer.Serialize(dto),
            ExecutedBy = User.Identity?.Name ?? "Admin",
            ExecutedAt = DateTime.UtcNow
        };
        db.OperatorCommands.Add(commandRecord);
        await db.SaveChangesAsync();

        // 2. إرسال الأمر عبر MQTT إلى التوربين الحقيقي
        var topic = $"farm/6dc34e0e-30ad-4fde-9a2e-3a98b4ea9df7/windmill/{turbineId}/command";
        var payload = JsonSerializer.Serialize(dto);
        
        await mqtt.PublishAsync(topic, payload);

        return Ok(new { status = "Command Sent", topic });
    }
}

public class CommandDto
{
    public string Action { get; set; } = string.Empty; // "start", "stop", "setPitch", "setInterval"
    public double? Value { get; set; }  // لـ setInterval
    public double? Angle { get; set; }  // لـ setPitch
    public string? Reason { get; set; } // لـ stop
}