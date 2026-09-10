using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlyToHappy.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoCheckIns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DemoCheckIns",
                columns: table => new
                {
                    DemoCheckInId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PassengerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FlightId = table.Column<int>(type: "int", nullable: false),
                    IsCheckedIn = table.Column<bool>(type: "bit", nullable: false),
                    CheckInDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SeatNumber = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    BoardingPassNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemoCheckIns", x => x.DemoCheckInId);
                    table.ForeignKey(
                        name: "FK_DemoCheckIns_Flights_FlightId",
                        column: x => x.FlightId,
                        principalTable: "Flights",
                        principalColumn: "FlightId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DemoCheckIns_Passengers_PassengerId",
                        column: x => x.PassengerId,
                        principalTable: "Passengers",
                        principalColumn: "PassengerId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DemoCheckIns_BoardingPassNumber",
                table: "DemoCheckIns",
                column: "BoardingPassNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DemoCheckIns_FlightId_SeatNumber",
                table: "DemoCheckIns",
                columns: new[] { "FlightId", "SeatNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DemoCheckIns_PassengerId_FlightId",
                table: "DemoCheckIns",
                columns: new[] { "PassengerId", "FlightId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemoCheckIns");
        }
    }
}
