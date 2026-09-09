namespace FlyToHappy.Models
{
    public class Reservation
    {

        public Guid ReservationId { get; set; } = Guid.NewGuid();

        // ========================
        // PNR (Passenger Name Record)
        // ========================
        public string Pnr { get; set; } = string.Empty;
        
        
        // ========================
        // Trip Type
        // ========================
        public string TripType { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;

        // ========================
        // Departure and Return Dates
        // ========================
        public DateOnly DepartureDate { get; set; } 
        public DateOnly? ReturnDate { get; set; }
        
        // ========================
        // Cabin 
        // ========================
        public string Cabin { get; set; } = string.Empty;
        
        // Passenger Counts
        public int Adults { get; set; }
        public int Children { get; set; }
        public int Infants { get; set; }
        public int TotalPassengers { get; set; }
        public int ChargeablePassengers { get; set; }
        
        // ========================
        //Contact Information
        // ========================
        public string ContactFirstName { get; set; } = string.Empty;
        public string ContactLastName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;

        // ========================
        // Flight Information
        // ========================
        public int DepartureFlightId { get; set; }
        public Flight DepartureFlight { get; set; } = null!;

        public int? ReturnFlightId { get; set; }
        public Flight? ReturnFlight { get; set; }

        // ========================
        // Passenger Information
        // ========================
        public List<Passenger> Passengers { get; set; } = new();

        // ========================
        // Baggage Selection
        // ========================
        public BaggageSelection BaggageSelection { get; set; } = new();
        
        // ========================
        // Price Summary
        // ========================
        public BookingPriceSummary PriceSummary { get; set; } = new();
    }
}
