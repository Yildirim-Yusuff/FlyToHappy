using FlyToHappy.Dtos.Flights;

namespace FlyToHappy.Services.RapidApiServices
{
    public interface IRapidApiFlightService
    {
        Task<string> GetLocationsAsync();

        Task<string> GetDemoFlightAsync();

        Task<List<SearchFlightDto>> SearchFlightsAsync(string departureAirport, string arrivalAirport, string date, string cabin);

        SearchFlightDto? GetCachedSearchFlight(Guid searchFlightId);

        Task<List<AirportSuggestionDto>> SearchAirportsAsync(string query);
    }
}
