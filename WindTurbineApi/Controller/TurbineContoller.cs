using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Data;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Controller;

[ApiController]
[Route("api/turbines")]
public class TurbinesController(WindTurbineDbContext db) : ControllerBase
{
    // 1. جلب كل التوربينات مع آخر 10 مقاييس والتنبيهات
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var turbines = await db.Turbines
            .Include(t => t.Metrics.OrderByDescending(m => m.Timestamp).Take(10))
            .Include(t => t.Alerts.OrderByDescending(a => a.Timestamp).Take(5))
            .ToListAsync();

        return Ok(turbines);
    }

    // 2. جلب توربين محدد بكل بياناته
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var turbine = await db.Turbines
            .Include(t => t.Metrics.OrderByDescending(m => m.Timestamp).Take(50))
            .Include(t => t.Alerts.OrderByDescending(a => a.Timestamp))
            .FirstOrDefaultAsync(t => t.Id == id);

        if (turbine == null)
            return NotFound(new { message = $"Turbine with ID {id} not found." });

        return Ok(turbine);
    }

    // 3. جلب مقاييس توربين معين بشكل منفصل (آخر 100 سجل)
    [HttpGet("{id}/metrics")]
    public async Task<IActionResult> GetMetrics(string id)
    {
        var exists = await db.Turbines.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound();

        var metrics = await db.TurbineMetrics
            .Where(m => m.TurbineId == id)
            .OrderByDescending(m => m.Timestamp)
            .Take(100)
            .ToListAsync();

        return Ok(metrics);
    }

    // 4. جلب تنبيهات توربين معين
    [HttpGet("{id}/alerts")]
    public async Task<IActionResult> GetAlerts(string id)
    {
        var exists = await db.Turbines.AnyAsync(t => t.Id == id);
        if (!exists) return NotFound();

        var alerts = await db.Alerts
            .Where(a => a.TurbineId == id)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return Ok(alerts);
    }
}