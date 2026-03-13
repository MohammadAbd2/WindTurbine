using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace WindTurbineApi.Entities;

public partial class WindTurbineDbContext : DbContext
{
    public WindTurbineDbContext()
    {
    }

    public WindTurbineDbContext(DbContextOptions<WindTurbineDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=ep-lucky-star-adsenypr-pooler.c-2.us-east-1.aws.neon.tech; Database=neondb; Username=neondb_owner; Password=npg_Bh3xUqswpel6; SSL Mode=VerifyFull; Channel Binding=Require;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
