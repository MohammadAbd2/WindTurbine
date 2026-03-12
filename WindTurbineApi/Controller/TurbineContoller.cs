using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Data;

namespace WindTurbineApi.Controller;

[ApiController]
[Route("api/turbines")]
public class TurbinesController(WindTurbineDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var turbines = await db.Turbines.ToListAsync();
        return Ok(turbines);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var turbine = await db.Turbines.FindAsync(id);

        if (turbine == null)
            return NotFound();

        return Ok(turbine);
    }

    [HttpGet("{id}/metrics")]
    public async Task<IActionResult> GetMetrics(string id)
    {
        var metrics = await db.TurbineMetrics
            .Where(m => m.TurbineId == id)
            .OrderByDescending(m => m.Timestamp)
            .Take(100)
            .ToListAsync();

        return Ok(metrics);
    }

    [HttpGet("{id}/alerts")]
    public async Task<IActionResult> GetAlerts(string id)
    {
        var alerts = await db.Alerts
            .Where(a => a.TurbineId == id)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return Ok(alerts);
    }
}