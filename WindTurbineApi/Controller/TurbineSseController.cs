using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using StateleSSE.AspNetCore;
using WindTurbineApi.Data;

namespace WindTurbineApi.Controller;

[ApiController]
[Route("sse")]
public class TurbineSseController(
    WindTurbineDbContext db,
    ISseBackplane backplane
) : RealtimeControllerBase(backplane)
{
    [HttpGet("metrics")]
    public async Task GetMetrics(CancellationToken ct)
    {
        Console.WriteLine("[SSE] Client connected");

        try
        {
            // إرسال initial snapshot 
            var metrics = await db.TurbineMetrics
                .AsNoTracking()
                .OrderByDescending(m => m.Timestamp)
                .Take(15)
                .ToListAsync(ct);

            var alerts = await db.Alerts
                .AsNoTracking()
                .OrderByDescending(a => a.Timestamp)
                .Take(5)
                .ToListAsync(ct);

            var payload = new
            {
                metrics,
                alerts
            };

            // ⚠️ هذه هي الطريقة الوحيدة المتاحة في نسختك
            await backplane.Clients.SendToAllAsync(payload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[SSE ERROR] {ex.Message}");
        }

        // إبقاء الاتصال مفتوح (مهم جدًا)
        while (!ct.IsCancellationRequested)
        {
            await Task.Delay(5000, ct);
        }
    }
}