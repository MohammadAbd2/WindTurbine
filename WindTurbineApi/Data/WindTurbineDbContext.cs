using Microsoft.EntityFrameworkCore;
using WindTurbineApi.Entities;

namespace WindTurbineApi.Data;

public class WindTurbineDbContext : DbContext
{
    public WindTurbineDbContext(DbContextOptions<WindTurbineDbContext> options) : base(options)
    {
    }

    public DbSet<Turbine> Turbines { get; set; }
    public DbSet<TurbineMetric> TurbineMetrics { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<OperatorCommand> OperatorCommands { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Add any fluent API configurations here if necessary
    }
}