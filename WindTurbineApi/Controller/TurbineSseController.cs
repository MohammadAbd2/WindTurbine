using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Data;
using System.Text.Json;

namespace WindTurbineApi.Controller;

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
        // 1. إعدادات الـ SSE
        Response.ContentType = "text/event-stream";
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        Console.WriteLine("[SSE] Client connected. Streaming data from DataBase ...");

        // 2. حلقة إرسال البيانات
        while (!ct.IsCancellationRequested)
        {
            try 
            {
                // جلب أحدث 15 قراءة مسجلة في قاعدة البيانات
                var metrics = await _db.TurbineMetrics
                    .AsNoTracking()
                    .OrderByDescending(m => m.Timestamp)
                    .Take(15)
                    .ToListAsync(ct);

                var json = JsonSerializer.Serialize(metrics);
                
                // إرسال البيانات
                await Response.WriteAsync($"data: {json}\n\n", ct);
                await Response.Body.FlushAsync(ct);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SSE] Stream Error: {ex.Message}");
                break; 
            }

            // تأخير 5 ثوانٍ قبل القراءة التالية من الداتابيز
            await Task.Delay(5000, ct);
        }
    }
}