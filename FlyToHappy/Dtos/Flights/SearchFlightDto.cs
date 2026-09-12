namespace FlyToHappy.Dtos.Flights
{
    // One flight row shown on SearchResults. Shape matches the flight card object
    // that flight-list.js already renders and filters, so the frontend needs no remap.
    public class SearchFlightDto
    {
        public Guid SearchFlightId { get; set; }

        public string Airline { get; set; } = string.Empty;
        public string AirlineCode { get; set; } = string.Empty;
        public string FlightNumber { get; set; } = string.Empty;

        public string DepartureAirport { get; set; } = string.Empty;
        public string ArrivalAirport { get; set; } = string.Empty;

        // Full airport names as the provider sends them (e.g. "Kayseri Erkilet Airport"). Empty if the provider has none.
        public string DepartureAirportName { get; set; } = string.Empty;
        public string ArrivalAirportName { get; set; } = string.Empty;

        // Every leg of the itinerary. 1-stop flights have two segments (e.g. TK2023 ASR->SAW, TK2816 SAW->TZX).
        public List<FlightSegmentDto> Segments { get; set; } = new();

        public string DepartureTime { get; set; } = string.Empty;
        public string ArrivalTime { get; set; } = string.Empty;

        public string Duration { get; set; } = string.Empty;
        public int Stops { get; set; }

        public int BaggageKg { get; set; }
        public bool CabinBaggageIncluded { get; set; }
        public bool CheckedBaggageIncluded { get; set; }

        public string CabinClass { get; set; } = string.Empty;

        // Provider fare for ONE passenger. Backend multiplies it at reservation time.
        public decimal Price { get; set; }
    }
}
