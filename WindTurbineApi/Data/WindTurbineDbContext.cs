using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Data;

public class WindTurbineDbContext(DbContextOptions<WindTurbineDbContext> options) : DbContext(options)
{
    public DbSet<Turbine> Turbines { get; set; }
    public DbSet<TurbineMetric> TurbineMetrics { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<OperatorCommand> OperatorCommands { get; set; }
}