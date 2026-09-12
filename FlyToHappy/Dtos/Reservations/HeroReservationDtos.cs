using FlyToHappy.Dtos.Flights;

namespace FlyToHappy.Dtos.Reservations
{
    public class TripLookupDto
    {
        public string Pnr { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
    }

    public class TripPassengerDto
    {
        public Guid PassengerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PassengerType { get; set; } = string.Empty;
    }

    public class TripDetailDto
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
        public List<TripPassengerDto> Passengers { get; set; } = new();
        public ReservationBaggageDto BaggageSelection { get; set; } = new();
        public ReservationPriceSummaryDto PriceSummary { get; set; } = new();
    }

    public class CheckInLookupDto
    {
        public TripDetailDto Trip { get; set; } = new();
        public List<CheckInFlightDto> Flights { get; set; } = new();
        public List<BoardingPassDto> CheckIns { get; set; } = new();
    }

    public class CheckInFlightDto
    {
        public int FlightId { get; set; }
        public DateOnly Date { get; set; }
        public ReservationFlightDto Flight { get; set; } = new();
        public List<string> OccupiedSeats { get; set; } = new();
    }

    public class CompleteCheckInDto
    {
        public string Pnr { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public Guid PassengerId { get; set; }
        public int FlightId { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
    }

    public class BoardingPassDto
    {
        public Guid PassengerId { get; set; }
        public int FlightId { get; set; }
        public string PassengerName { get; set; } = string.Empty;
        public string Pnr { get; set; } = string.Empty;
        public string Airline { get; set; } = string.Empty;
        public string FlightNumber { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string FromAirportName { get; set; } = string.Empty;
        public string ToAirportName { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string DepartureTime { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public string Cabin { get; set; } = string.Empty;
        public string BoardingPassNumber { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
    }

    public class FlightStatusDto
    {
        public string FlightNumber { get; set; } = string.Empty;
        public string Airline { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string FromAirportName { get; set; } = string.Empty;
        public string ToAirportName { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public string DepartureTime { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;
        public List<FlightSegmentDto> Segments { get; set; } = new();
        public string StatusMessage { get; set; } = "Güncel uçuş durumu verisi mevcut değil.";
    }
}
