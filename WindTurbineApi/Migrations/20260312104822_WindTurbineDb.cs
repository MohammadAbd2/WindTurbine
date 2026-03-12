using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WindTurbineApi.Migrations
{
    /// <inheritdoc />
    public partial class WindTurbineDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OperatorCommands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TurbineId = table.Column<string>(type: "text", nullable: false),
                    CommandType = table.Column<string>(type: "text", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: false),
                    ExecutedBy = table.Column<string>(type: "text", nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperatorCommands", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Turbines",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Turbines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TurbineId = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alerts_Turbines_TurbineId",
                        column: x => x.TurbineId,
                        principalTable: "Turbines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TurbineMetrics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TurbineId = table.Column<string>(type: "text", nullable: false),
                    WindSpeed = table.Column<double>(type: "double precision", nullable: false),
                    Temperature = table.Column<double>(type: "double precision", nullable: false),
                    PowerOutput = table.Column<double>(type: "double precision", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TurbineMetrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TurbineMetrics_Turbines_TurbineId",
                        column: x => x.TurbineId,
                        principalTable: "Turbines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_TurbineId",
                table: "Alerts",
                column: "TurbineId");

            migrationBuilder.CreateIndex(
                name: "IX_TurbineMetrics_TurbineId",
                table: "TurbineMetrics",
                column: "TurbineId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "OperatorCommands");

            migrationBuilder.DropTable(
                name: "TurbineMetrics");

            migrationBuilder.DropTable(
                name: "Turbines");
        }
    }
}
