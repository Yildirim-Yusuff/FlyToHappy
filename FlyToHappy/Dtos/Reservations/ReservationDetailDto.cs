namespace FlyToHappy.Dtos.Reservations
{
    public class ReservationDetailDto
    {
        public Guid ReservationId { get; set; }
        public string Pnr { get; set; } = string.Empty;
        public string TripType { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public DateOnly DepartureDate { get; set; }
        public DateOnly? ReturnDate { get; set; }
        public string Cabin { get; set; } = string.Empty;
        public int TotalPassengers { get; set; }
        public ReservationFlightDto DepartureFlight { get; set; } = new();
        public ReservationFlightDto? ReturnFlight { get; set; }
        public List<PassengerInfoDto> Passengers { get; set; } = new();
        public ReservationBaggageDto BaggageSelection { get; set; } = new();
        public ReservationPriceSummaryDto PriceSummary { get; set; } = new();
    }
}
