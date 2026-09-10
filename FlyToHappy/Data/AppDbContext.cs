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
        public DbSet<DemoCheckIn> DemoCheckIns { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Local demo check-in belongs to one passenger and one flight snapshot.
            modelBuilder.Entity<DemoCheckIn>().HasOne(c => c.Passenger)
                .WithMany().HasForeignKey(c => c.PassengerId).OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<DemoCheckIn>().HasOne(c => c.Flight)
                .WithMany().HasForeignKey(c => c.FlightId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<DemoCheckIn>().Property(c => c.SeatNumber).HasMaxLength(3);
            modelBuilder.Entity<DemoCheckIn>().Property(c => c.BoardingPassNumber).HasMaxLength(32);
            modelBuilder.Entity<DemoCheckIn>().HasIndex(c => new { c.PassengerId, c.FlightId }).IsUnique();
            modelBuilder.Entity<DemoCheckIn>().HasIndex(c => new { c.FlightId, c.SeatNumber }).IsUnique();
            modelBuilder.Entity<DemoCheckIn>().HasIndex(c => c.BoardingPassNumber).IsUnique();

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



