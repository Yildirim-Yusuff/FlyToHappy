using FlyToHappy.Models;
using Microsoft.EntityFrameworkCore;

namespace FlyToHappy.Data
{
    public class AppDbContext : DbContext
    {

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {


        }

        public DbSet<Passenger> Passengers { get; set; }
        public DbSet<Flight> Flights { get; set; }
        public DbSet<Reservation> Reservations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Keep demo IDs and per-passenger fares aligned with flight-list.js.
            modelBuilder.Entity<Flight>().HasData(
                new Flight
                {
                    FlightId = 1,
                    Airline = "Turkish Airlines",
                    AirlineCode = "TK",
                    FlightNumber = "TK1861",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "08:10",
                    ArrivalTime = "09:55",
                    Duration = "2 sa 45 dk",
                    Stops = 0,
                    BaggageKg = 23,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 2490m,
                    BasePrice = 2490m
                },
                new Flight
                {
                    FlightId = 2,
                    Airline = "AJet",
                    AirlineCode = "VF",
                    FlightNumber = "VF1306",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "09:30",
                    ArrivalTime = "11:10",
                    Duration = "2 sa 40 dk",
                    Stops = 0,
                    BaggageKg = 20,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 1940m,
                    BasePrice = 1940m
                },
                new Flight
                {
                    FlightId = 3,
                    Airline = "Pegasus",
                    AirlineCode = "PC",
                    FlightNumber = "PC1248",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "05:40",
                    ArrivalTime = "11:20",
                    Duration = "6 sa 40 dk",
                    Stops = 1,
                    BaggageKg = 15,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = false,
                    CabinClass = "Ekonomi",
                    Price = 1690m,
                    BasePrice = 1690m
                },
                new Flight
                {
                    FlightId = 4,
                    Airline = "Pegasus",
                    AirlineCode = "PC",
                    FlightNumber = "PC1242",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "06:25",
                    ArrivalTime = "08:20",
                    Duration = "2 sa 55 dk",
                    Stops = 0,
                    BaggageKg = 15,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = false,
                    CabinClass = "Ekonomi",
                    Price = 1850m,
                    BasePrice = 1850m
                },
                new Flight
                {
                    FlightId = 5,
                    Airline = "AJet",
                    AirlineCode = "VF",
                    FlightNumber = "VF1312",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "12:05",
                    ArrivalTime = "13:55",
                    Duration = "2 sa 50 dk",
                    Stops = 0,
                    BaggageKg = 20,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 1790m,
                    BasePrice = 1790m
                },
                new Flight
                {
                    FlightId = 6,
                    Airline = "Pegasus",
                    AirlineCode = "PC",
                    FlightNumber = "PC1256",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "15:15",
                    ArrivalTime = "17:15",
                    Duration = "3 saat",
                    Stops = 0,
                    BaggageKg = 20,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 2090m,
                    BasePrice = 2090m
                },
                new Flight
                {
                    FlightId = 7,
                    Airline = "AJet",
                    AirlineCode = "VF",
                    FlightNumber = "VF1318",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "21:20",
                    ArrivalTime = "23:15",
                    Duration = "2 sa 55 dk",
                    Stops = 0,
                    BaggageKg = 20,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = false,
                    CabinClass = "Ekonomi",
                    Price = 2150m,
                    BasePrice = 2150m
                },
                new Flight
                {
                    FlightId = 8,
                    Airline = "Pegasus",
                    AirlineCode = "PC",
                    FlightNumber = "PC1260",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "16:40",
                    ArrivalTime = "22:05",
                    Duration = "6 sa 25 dk",
                    Stops = 1,
                    BaggageKg = 15,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = false,
                    CabinClass = "Ekonomi",
                    Price = 2290m,
                    BasePrice = 2290m
                },
                new Flight
                {
                    FlightId = 9,
                    Airline = "Turkish Airlines",
                    AirlineCode = "TK",
                    FlightNumber = "TK1863",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "19:05",
                    ArrivalTime = "20:55",
                    Duration = "2 sa 50 dk",
                    Stops = 0,
                    BaggageKg = 23,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 2390m,
                    BasePrice = 2390m
                },
                new Flight
                {
                    FlightId = 10,
                    Airline = "Turkish Airlines",
                    AirlineCode = "TK",
                    FlightNumber = "TK1867",
                    DepartureAirport = "IST",
                    ArrivalAirport = "FCO",
                    DepartureTime = "13:40",
                    ArrivalTime = "15:30",
                    Duration = "2 sa 50 dk",
                    Stops = 0,
                    BaggageKg = 23,
                    CabinBaggageIncluded = true,
                    CheckedBaggageIncluded = true,
                    CabinClass = "Ekonomi",
                    Price = 2650m,
                    BasePrice = 2650m
                }
            );


            // ========================
            // Flight Entity Configuration
            // ========================

            // Configure the relationship between, Reservation -> Passengers
            modelBuilder.Entity<Reservation>()
                .HasMany(r => r.Passengers)
                .WithOne(p => p.Reservation)
                .HasForeignKey(p => p.ReservationId)
                .OnDelete(DeleteBehavior.Cascade);


            // Reservation -> Departure Flight
            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.DepartureFlight)
                .WithMany()
                .HasForeignKey(r => r.DepartureFlightId)
                .OnDelete(DeleteBehavior.Restrict);


            // Reservation -> Return Flight
            modelBuilder.Entity<Reservation>()
                .HasOne(r => r.ReturnFlight)
                .WithMany()
                .HasForeignKey(r => r.ReturnFlightId)
                .OnDelete(DeleteBehavior.Restrict);





            // ========================
            // Baggage Information Configuration
            // ========================

            // Reservation -> Baggage Selection
            modelBuilder.Entity<Reservation>()
                .OwnsOne(r => r.BaggageSelection, baggage =>
                {
                    baggage.OwnsOne(b => b.CabinBaggage);
                    baggage.OwnsOne(b => b.CheckedBaggage);
                });

            // Reservation -> Price Summary
            modelBuilder.Entity<Reservation>()
                .OwnsOne(r => r.PriceSummary);



            // Reservation -> PNR Configuration
            modelBuilder.Entity<Reservation>()
                .Property(r => r.Pnr)
                .HasMaxLength(6)
                .IsRequired();

            modelBuilder.Entity<Reservation>()
                .HasIndex(r => r.Pnr)
                .IsUnique();

        }



    }


}



