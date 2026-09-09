namespace FlyToHappy.Dtos.Reservations
{
    public class ReservationFlightDto
    {
        public string Airline { get; set; } = string.Empty;
        public string AirlineCode { get; set; } = string.Empty;
        public string FlightNumber { get; set; } = string.Empty;
        public string DepartureAirport { get; set; } = string.Empty;
        public string ArrivalAirport { get; set; } = string.Empty;
        public string DepartureTime { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public int Stops { get; set; }
    }
}
