namespace FlyToHappy.Dtos.Flights
{
    // Query string of GET /api/RapidApiFlights/search?from=IST&to=FCO&date=2026-10-10&cabin=Economy
    public class FlightSearchRequestDto
    {
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Cabin { get; set; } = string.Empty;
    }
}
