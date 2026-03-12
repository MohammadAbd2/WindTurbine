using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Data;
using StateleSSE.AspNetCore;

namespace WindTurbineApi.Controllers;

[Route("sse")]
[ApiController]
public class TurbineSseController : ControllerBase
{
    private readonly WindTurbineDbContext _db;

    public TurbineSseController(WindTurbineDbContext db)
    {
        _db = db;
    }

    [HttpGet("metrics")]
    public async Task GetMetrics(CancellationToken ct)
    {
        // الحل البديل في حال فشل الـ Extension Method: 
        // استخدام Response.WriteAsync يدوياً مع الالتزام بمتطلبات المكتبة
        Response.ContentType = "text/event-stream";
        Response.Headers.Add("Cache-Control", "no-cache");
        Response.Headers.Add("Connection", "keep-alive");

        while (!ct.IsCancellationRequested)
        {
            var metrics = await _db.TurbineMetrics
                .OrderByDescending(m => m.Timestamp)
                .Take(10)
                .ToListAsync(ct);

            var json = System.Text.Json.JsonSerializer.Serialize(metrics);
            
            // كتابة البيانات بصيغة SSE يدوياً لضمان العمل 100%
            await Response.WriteAsync($"data: {json}\n\n", ct);
            await Response.Body.FlushAsync(ct);

            await Task.Delay(5000, ct);
        }
    }
}