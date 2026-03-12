using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WindTurbineApi.Data;
using System.Text.Json;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;

[Authorize]
[ApiController]
[Route("api/turbines/{turbineId}/commands")]
public class CommandController : ControllerBase
{
    private readonly WindTurbineDbContext _db;

    public CommandController(WindTurbineDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> SendCommand(string turbineId, CommandDto dto)
    {
        var command = new OperatorCommand
        {
            TurbineId = turbineId,
            CommandType = dto.CommandType,
            Payload = JsonSerializer.Serialize(dto),
            ExecutedBy = User.Identity?.Name ?? "Unknown",
            ExecutedAt = DateTime.UtcNow
        };

        _db.OperatorCommands.Add(command);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Command saved" });
    }
}