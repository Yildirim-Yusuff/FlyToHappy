namespace FlyToHappy.Models
{
    public class Flight
    {
        public int FlightId { get; set; }

        public string Airline { get; set; } = string.Empty;
        public string AirlineCode { get; set; } = string.Empty;

        public string FlightNumber { get; set; } = string.Empty;

        public string DepartureAirport { get; set; } = string.Empty;

        public string ArrivalAirport { get; set; } = string.Empty;

        // Provider airport names, copied at reservation time. Older snapshots have empty strings.
        public string DepartureAirportName { get; set; } = string.Empty;

        public string ArrivalAirportName { get; set; } = string.Empty;

        // Itinerary legs stored as JSON text (List<FlightSegmentDto>). Empty for older snapshots.
        public string SegmentsJson { get; set; } = string.Empty;

        public string DepartureTime { get; set; } = string.Empty;

        public string ArrivalTime { get; set; } = string.Empty;

        public string Duration { get; set; } = string.Empty;

        public int Stops { get; set; }

        public int BaggageKg { get; set; }

        public bool CabinBaggageIncluded { get; set; }

        public bool CheckedBaggageIncluded { get; set; }

        public string CabinClass { get; set; } = string.Empty;

        public decimal BasePrice { get; set; }

        public decimal Price { get; set; }
    }
}
