using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FlyToHappy.Migrations
{
    /// <inheritdoc />
    public partial class SeedDemoFlights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Flights",
                columns: new[] { "FlightId", "Airline", "AirlineCode", "ArrivalAirport", "ArrivalTime", "BaggageKg", "BasePrice", "CabinBaggageIncluded", "CabinClass", "CheckedBaggageIncluded", "DepartureAirport", "DepartureTime", "Duration", "FlightNumber", "Price", "Stops" },
                values: new object[,]
                {
                    { 1, "Turkish Airlines", "TK", "FCO", "09:55", 23, 2490m, true, "Ekonomi", true, "IST", "08:10", "2 sa 45 dk", "TK1861", 2490m, 0 },
                    { 2, "AJet", "VF", "FCO", "11:10", 20, 1940m, true, "Ekonomi", true, "IST", "09:30", "2 sa 40 dk", "VF1306", 1940m, 0 },
                    { 3, "Pegasus", "PC", "FCO", "11:20", 15, 1690m, true, "Ekonomi", false, "IST", "05:40", "6 sa 40 dk", "PC1248", 1690m, 1 },
                    { 4, "Pegasus", "PC", "FCO", "08:20", 15, 1850m, true, "Ekonomi", false, "IST", "06:25", "2 sa 55 dk", "PC1242", 1850m, 0 },
                    { 5, "AJet", "VF", "FCO", "13:55", 20, 1790m, true, "Ekonomi", true, "IST", "12:05", "2 sa 50 dk", "VF1312", 1790m, 0 },
                    { 6, "Pegasus", "PC", "FCO", "17:15", 20, 2090m, true, "Ekonomi", true, "IST", "15:15", "3 saat", "PC1256", 2090m, 0 },
                    { 7, "AJet", "VF", "FCO", "23:15", 20, 2150m, true, "Ekonomi", false, "IST", "21:20", "2 sa 55 dk", "VF1318", 2150m, 0 },
                    { 8, "Pegasus", "PC", "FCO", "22:05", 15, 2290m, true, "Ekonomi", false, "IST", "16:40", "6 sa 25 dk", "PC1260", 2290m, 1 },
                    { 9, "Turkish Airlines", "TK", "FCO", "20:55", 23, 2390m, true, "Ekonomi", true, "IST", "19:05", "2 sa 50 dk", "TK1863", 2390m, 0 },
                    { 10, "Turkish Airlines", "TK", "FCO", "15:30", 23, 2650m, true, "Ekonomi", true, "IST", "13:40", "2 sa 50 dk", "TK1867", 2650m, 0 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Flights",
                keyColumn: "FlightId",
                keyValue: 10);
        }
    }
}
