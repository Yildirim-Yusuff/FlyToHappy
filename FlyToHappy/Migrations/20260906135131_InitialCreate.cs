using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlyToHappy.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    FlightId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Airline = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AirlineCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FlightNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartureAirport = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ArrivalAirport = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartureTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ArrivalTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Duration = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Stops = table.Column<int>(type: "int", nullable: false),
                    BaggageKg = table.Column<int>(type: "int", nullable: false),
                    CabinBaggageIncluded = table.Column<bool>(type: "bit", nullable: false),
                    CheckedBaggageIncluded = table.Column<bool>(type: "bit", nullable: false),
                    CabinClass = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.FlightId);
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                columns: table => new
                {
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Pnr = table.Column<string>(type: "nvarchar(6)", maxLength: 6, nullable: false),
                    TripType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    From = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    To = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartureDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ReturnDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Cabin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Adults = table.Column<int>(type: "int", nullable: false),
                    Children = table.Column<int>(type: "int", nullable: false),
                    Infants = table.Column<int>(type: "int", nullable: false),
                    TotalPassengers = table.Column<int>(type: "int", nullable: false),
                    ChargeablePassengers = table.Column<int>(type: "int", nullable: false),
                    ContactFirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactLastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartureFlightId = table.Column<int>(type: "int", nullable: false),
                    ReturnFlightId = table.Column<int>(type: "int", nullable: true),
                    BaggageSelection_CabinBaggage_Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BaggageSelection_CabinBaggage_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BaggageSelection_CabinBaggage_Kg = table.Column<int>(type: "int", nullable: false),
                    BaggageSelection_CabinBaggage_Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BaggageSelection_CheckedBaggage_Type = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BaggageSelection_CheckedBaggage_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BaggageSelection_CheckedBaggage_Kg = table.Column<int>(type: "int", nullable: false),
                    BaggageSelection_CheckedBaggage_Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BaggageSelection_TotalBaggagePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_DepartureFlightPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_ReturnFlightPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_CabinBaggagePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_CheckedBaggagePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_BaggagePrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PriceSummary_TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.ReservationId);
                    table.ForeignKey(
                        name: "FK_Reservations_Flights_DepartureFlightId",
                        column: x => x.DepartureFlightId,
                        principalTable: "Flights",
                        principalColumn: "FlightId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_Flights_ReturnFlightId",
                        column: x => x.ReturnFlightId,
                        principalTable: "Flights",
                        principalColumn: "FlightId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Passengers",
                columns: table => new
                {
                    PassengerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PassengerType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BirthDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nationality = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NationalId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NotTurkishCitizen = table.Column<bool>(type: "bit", nullable: false),
                    HasPassport = table.Column<bool>(type: "bit", nullable: false),
                    PassportNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PassportExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passengers", x => x.PassengerId);
                    table.ForeignKey(
                        name: "FK_Passengers_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservations",
                        principalColumn: "ReservationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Passengers_ReservationId",
                table: "Passengers",
                column: "ReservationId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_DepartureFlightId",
                table: "Reservations",
                column: "DepartureFlightId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_Pnr",
                table: "Reservations",
                column: "Pnr",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ReturnFlightId",
                table: "Reservations",
                column: "ReturnFlightId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Passengers");

            migrationBuilder.DropTable(
                name: "Reservations");

            migrationBuilder.DropTable(
                name: "Flights");
        }
    }
}
