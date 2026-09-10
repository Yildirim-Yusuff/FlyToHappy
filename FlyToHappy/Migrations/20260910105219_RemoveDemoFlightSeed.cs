using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FlyToHappy.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDemoFlightSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Demo flights (FlightId 1-10) are no longer seeded. Remove the ones that
            // no reservation references. Flights already used by a reservation are kept
            // as historical snapshots (deleting them would break the FK anyway).
            migrationBuilder.Sql(@"
                DELETE FROM Flights
                WHERE FlightId BETWEEN 1 AND 10
                  AND FlightId NOT IN (SELECT DepartureFlightId FROM Reservations)
                  AND FlightId NOT IN (SELECT ReturnFlightId FROM Reservations WHERE ReturnFlightId IS NOT NULL);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Demo seed is intentionally not restored.
        }
    }
}
