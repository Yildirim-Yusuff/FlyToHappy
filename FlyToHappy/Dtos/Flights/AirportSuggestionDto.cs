namespace FlyToHappy.Dtos.Flights
{
    // One row of the From / To autocomplete. The user sees Name, the system uses Code.
    public class AirportSuggestionDto
    {
        public string Code { get; set; } = string.Empty;        // IATA, e.g. IST
        public string Name { get; set; } = string.Empty;        // Istanbul Airport
        public string City { get; set; } = string.Empty;        // İstanbul
        public string Description { get; set; } = string.Empty; // "İstanbul, Türkiye" or provider subtitle
    }
}
