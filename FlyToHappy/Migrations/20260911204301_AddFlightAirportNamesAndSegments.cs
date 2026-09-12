using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlyToHappy.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightAirportNamesAndSegments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ArrivalAirportName",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DepartureAirportName",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SegmentsJson",
                table: "Flights",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArrivalAirportName",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "DepartureAirportName",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "SegmentsJson",
                table: "Flights");
        }
    }
}
