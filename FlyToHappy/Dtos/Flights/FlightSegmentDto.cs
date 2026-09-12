namespace FlyToHappy.Dtos.Flights
{
    // One leg of an itinerary. A direct flight has one segment, a 1-stop flight has two.
    // Comes from the provider (RapidAPI) and is copied into the Flight snapshot at reservation time.
    public class FlightSegmentDto
    {
        public string FlightNumber { get; set; } = string.Empty;        // TK2023
        public string DepartureAirport { get; set; } = string.Empty;    // ASR
        public string DepartureAirportName { get; set; } = string.Empty; // Kayseri Erkilet Airport
        public string DepartureTime { get; set; } = string.Empty;       // 22:35
        public string ArrivalAirport { get; set; } = string.Empty;      // SAW
        public string ArrivalAirportName { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;
    }
}
