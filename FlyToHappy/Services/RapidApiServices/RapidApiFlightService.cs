
using FlyToHappy.Dtos.Flights;
using FlyToHappy.Settings;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace FlyToHappy.Services.RapidApiServices
{
    public class RapidApiFlightService : IRapidApiFlightService
    {

        private readonly HttpClient _httpClient;
        private readonly RapidApiSettings _settings;
        private readonly IMemoryCache _memoryCache;

        // Only these carriers are shown on SearchResults.
        private static readonly string[] AllowedAirlineCodes = { "TK", "PC", "VF" };

        private static readonly TimeSpan SearchCacheDuration = TimeSpan.FromMinutes(60);

        private const int MaxAirportSuggestions = 10;
        private static readonly TimeSpan AirportCacheDuration = TimeSpan.FromHours(6);

        public RapidApiFlightService(HttpClient httpClient, IOptions<RapidApiSettings> settings, IMemoryCache memoryCache)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
            _memoryCache = memoryCache;
        }

        public async Task<string> GetDemoFlightAsync()
        {
            if (string.IsNullOrWhiteSpace(_settings.Key))
            {
                throw new InvalidOperationException("RapidApi Key bulunamadı. User Secrets içinde RapidApi:Key tanımlı olmalıdır.");
            }

            if (string.IsNullOrWhiteSpace(_settings.Host))
            {
                throw new InvalidOperationException("RapidApi Host bulunamadı. appsettings.json içinde RapidApi:Host tanımlı olmalıdır.");
            }

            var url =
               $"https://{_settings.Host}/api/v1/searchFlights" +
               "?departure_id=IST" +
               "&arrival_id=FCO" +
               "&outbound_date=2026-10-10" +
               "&adults=1" +
               "&travel_class=ECONOMY" +
               "&currency=TRY";

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            request.Headers.Add("X-RapidAPI-Key", _settings.Key);
            request.Headers.Add("X-RapidAPI-Host", _settings.Host);

            
            var response = await _httpClient.SendAsync(request);

            
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"RapidAPI isteği başarısız oldu. HTTP {(int)response.StatusCode}");
            }

            var result = await response.Content.ReadAsStringAsync();

            using var document = JsonDocument.Parse(result);

            
            
            
            var root = document.RootElement;
           
            if (!root.TryGetProperty("data", out var data))
            {
                throw new InvalidOperationException("RapidAPI cevabında 'data' alanı bulunamadı.");
            }

            if (!data.TryGetProperty("itineraries", out var itineraries))
            {
                throw new InvalidOperationException("RapidAPI cevabında 'itineraries' alanı bulunamadı.");
            }

            
            // Önce topFlights'a bak, ilk uçuşu döndür.
            if (itineraries.TryGetProperty("topFlights", out var topFlights)
                && topFlights.ValueKind == JsonValueKind.Array
                && topFlights.GetArrayLength() > 0)
            {
                var firstFlight = topFlights[0];
                return firstFlight.GetRawText();
            }

            // topFlights boşsa otherFlights'taki ilk uçuşa düş.
            if (itineraries.TryGetProperty("otherFlights", out var otherFlights)
                && otherFlights.ValueKind == JsonValueKind.Array
                && otherFlights.GetArrayLength() > 0)
            {
                var firstFlight = otherFlights[0];
                return firstFlight.GetRawText();
            }

            throw new InvalidOperationException("RapidAPI bu arama için uçuş döndürmedi.");
        }

        public async Task<List<SearchFlightDto>> SearchFlightsAsync(string departureAirport, string arrivalAirport, string date, string cabin)
        {
            if (string.IsNullOrWhiteSpace(_settings.Key))
            {
                throw new InvalidOperationException("RapidApi Key bulunamadı. User Secrets içinde RapidApi:Key tanımlı olmalıdır.");
            }

            if (string.IsNullOrWhiteSpace(_settings.Host))
            {
                throw new InvalidOperationException("RapidApi Host bulunamadı. appsettings.json içinde RapidApi:Host tanımlı olmalıdır.");
            }

            var travelClass = MapCabinToTravelClass(cabin);

            // adults=1 so the provider fare is for a single passenger.
            // ReservationService multiplies BasePrice by chargeable passengers later.
            var url =
               $"https://{_settings.Host}/api/v1/searchFlights" +
               "?departure_id=" + departureAirport +
               "&arrival_id=" + arrivalAirport +
               "&outbound_date=" + date +
               "&adults=1" +
               "&travel_class=" + travelClass +
               "&currency=TRY";

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            request.Headers.Add("X-RapidAPI-Key", _settings.Key);
            request.Headers.Add("X-RapidAPI-Host", _settings.Host);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"RapidAPI isteği başarısız oldu. HTTP {(int)response.StatusCode}");
            }

            var result = await response.Content.ReadAsStringAsync();

            using var document = JsonDocument.Parse(result);

            var root = document.RootElement;

            if (!root.TryGetProperty("data", out var data))
            {
                throw new InvalidOperationException("RapidAPI cevabında 'data' alanı bulunamadı.");
            }

            if (!data.TryGetProperty("itineraries", out var itineraries))
            {
                throw new InvalidOperationException("RapidAPI cevabında 'itineraries' alanı bulunamadı.");
            }

            // topFlights first, then otherFlights, in a single list.
            var allItineraries = new List<JsonElement>();

            if (itineraries.TryGetProperty("topFlights", out var topFlights) && topFlights.ValueKind == JsonValueKind.Array)
            {
                foreach (var itinerary in topFlights.EnumerateArray())
                {
                    allItineraries.Add(itinerary);
                }
            }

            if (itineraries.TryGetProperty("otherFlights", out var otherFlights) && otherFlights.ValueKind == JsonValueKind.Array)
            {
                foreach (var itinerary in otherFlights.EnumerateArray())
                {
                    allItineraries.Add(itinerary);
                }
            }

            var searchResults = new List<SearchFlightDto>();

            foreach (var itinerary in allItineraries)
            {
                if (!itinerary.TryGetProperty("flights", out var legs)
                    || legs.ValueKind != JsonValueKind.Array
                    || legs.GetArrayLength() == 0)
                {
                    continue;
                }

                // Every leg of the itinerary must be an allowed airline.
                var allLegsAllowed = true;

                foreach (var leg in legs.EnumerateArray())
                {
                    var legAirlineCode = GetAirlineCode(leg);

                    if (!AllowedAirlineCodes.Contains(legAirlineCode))
                    {
                        allLegsAllowed = false;
                        break;
                    }
                }

                if (!allLegsAllowed)
                {
                    continue;
                }

                if (!itinerary.TryGetProperty("price", out var priceElement) || priceElement.ValueKind != JsonValueKind.Number)
                {
                    continue;
                }

                




                var firstLeg = legs[0];
                var lastLeg = legs[legs.GetArrayLength() - 1];
                var airlineCode = GetAirlineCode(firstLeg);
                var flightNumbers = new List<string>();
                var segments = new List<FlightSegmentDto>();

                // One segment per leg. Flight numbers are also joined for the card title ("TK2023 / TK2816").
                foreach (var leg in legs.EnumerateArray())
                {
                    var legFlightNumber = (leg.GetProperty("flight_number").GetString() ?? "").Replace(" ", "");
                    flightNumbers.Add(legFlightNumber);

                    var legDeparture = leg.GetProperty("departure_airport");
                    var legArrival = leg.GetProperty("arrival_airport");
                    var legDepartureCode = GetString(legDeparture, "airport_code");
                    var legArrivalCode = GetString(legArrival, "airport_code");

                    segments.Add(new FlightSegmentDto
                    {
                        FlightNumber = legFlightNumber,
                        DepartureAirport = legDepartureCode,
                        DepartureAirportName = CleanAirportName(GetString(legDeparture, "airport_name"), legDepartureCode),
                        DepartureTime = GetClockTime(GetString(legDeparture, "time")),
                        ArrivalAirport = legArrivalCode,
                        ArrivalAirportName = CleanAirportName(GetString(legArrival, "airport_name"), legArrivalCode),
                        ArrivalTime = GetClockTime(GetString(legArrival, "time"))
                    });
                }

                var flightNumber = string.Join(" / ", flightNumbers);

                var departureAirportCode = firstLeg.GetProperty("departure_airport").GetProperty("airport_code").GetString() ?? "";
                var arrivalAirportCode = lastLeg.GetProperty("arrival_airport").GetProperty("airport_code").GetString() ?? "";

                // Real airport names from the provider, e.g. "Kayseri Erkilet Airport (ASR)" -> "Kayseri Erkilet Airport".
                var departureAirportName = CleanAirportName(GetString(firstLeg.GetProperty("departure_airport"), "airport_name"), departureAirportCode);
                var arrivalAirportName = CleanAirportName(GetString(lastLeg.GetProperty("arrival_airport"), "airport_name"), arrivalAirportCode);

                
                
                // Leg times come as "2026-10-10 04:25" (24h). We keep only "04:25".
                var departureTime = GetClockTime(firstLeg.GetProperty("departure_airport").GetProperty("time").GetString());
                var arrivalTime = GetClockTime(lastLeg.GetProperty("arrival_airport").GetProperty("time").GetString());

                var durationMinutes = 0;
                if (itinerary.TryGetProperty("duration", out var durationElement)
                    && durationElement.TryGetProperty("raw", out var rawMinutes)
                    && rawMinutes.ValueKind == JsonValueKind.Number)
                {
                    durationMinutes = rawMinutes.GetInt32();
                }

                var stops = legs.GetArrayLength() - 1;

                // Provider gives bag counts only (no kg). "checked: null" means unknown -> false.
                var cabinBaggageIncluded = false;
                var checkedBaggageIncluded = false;

                if (itinerary.TryGetProperty("bags", out var bags))
                {
                    if (bags.TryGetProperty("carry_on", out var carryOn) && carryOn.ValueKind == JsonValueKind.Number)
                    {
                        cabinBaggageIncluded = carryOn.GetInt32() > 0;
                    }

                    if (bags.TryGetProperty("checked", out var checkedBags) && checkedBags.ValueKind == JsonValueKind.Number)
                    {
                        checkedBaggageIncluded = checkedBags.GetInt32() > 0;
                    }
                }

                // Skip duplicates (same flight number at the same departure time).
                var isDuplicate = false;
                foreach (var existing in searchResults)
                {
                    if (existing.FlightNumber == flightNumber && existing.DepartureTime == departureTime)
                    {
                        isDuplicate = true;
                        break;
                    }
                }

                if (isDuplicate)
                {
                    continue;
                }

                var searchFlight = new SearchFlightDto
                {
                    SearchFlightId = Guid.NewGuid(),
                    Airline = GetAirlineName(airlineCode),
                    AirlineCode = airlineCode,
                    FlightNumber = flightNumber,
                    DepartureAirport = departureAirportCode,
                    ArrivalAirport = arrivalAirportCode,
                    DepartureAirportName = departureAirportName,
                    ArrivalAirportName = arrivalAirportName,
                    Segments = segments,
                    DepartureTime = departureTime,
                    ArrivalTime = arrivalTime,
                    Duration = FormatDuration(durationMinutes),
                    Stops = stops,
                    BaggageKg = 0,
                    CabinBaggageIncluded = cabinBaggageIncluded,
                    CheckedBaggageIncluded = checkedBaggageIncluded,
                    CabinClass = cabin,
                    Price = priceElement.GetDecimal()
                };

                // Backend keeps the authoritative snapshot. Frontend only carries the id.
                _memoryCache.Set(GetCacheKey(searchFlight.SearchFlightId), searchFlight, SearchCacheDuration);

                searchResults.Add(searchFlight);
            }

            return searchResults;
        }

        public SearchFlightDto? GetCachedSearchFlight(Guid searchFlightId)
        {
            if (_memoryCache.TryGetValue(GetCacheKey(searchFlightId), out SearchFlightDto? searchFlight))
            {
                return searchFlight;
            }

            return null;
        }

        public async Task<List<AirportSuggestionDto>> SearchAirportsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(_settings.Key))
            {
                throw new InvalidOperationException("RapidApi Key bulunamadı. User Secrets içinde RapidApi:Key tanımlı olmalıdır.");
            }

            if (string.IsNullOrWhiteSpace(_settings.Host))
            {
                throw new InvalidOperationException("RapidApi Host bulunamadı. appsettings.json içinde RapidApi:Host tanımlı olmalıdır.");
            }

            var normalizedQuery = query.Trim().ToLowerInvariant();
            var cacheKey = "airports:" + normalizedQuery;

            // Same text typed again -> answer from cache, no provider call.
            if (_memoryCache.TryGetValue(cacheKey, out List<AirportSuggestionDto>? cachedSuggestions) && cachedSuggestions != null)
            {
                return cachedSuggestions;
            }

            var url =
               $"https://{_settings.Host}/api/v1/searchAirport" +
               "?query=" + Uri.EscapeDataString(normalizedQuery) +
               "&language_code=tr";

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            request.Headers.Add("X-RapidAPI-Key", _settings.Key);
            request.Headers.Add("X-RapidAPI-Host", _settings.Host);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"RapidAPI havalimanı isteği başarısız oldu. HTTP {(int)response.StatusCode}");
            }

            var result = await response.Content.ReadAsStringAsync();

            using var document = JsonDocument.Parse(result);

            var root = document.RootElement;

            if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidOperationException("RapidAPI havalimanı cevabında 'data' listesi bulunamadı.");
            }

            var suggestions = new List<AirportSuggestionDto>();

            foreach (var entry in data.EnumerateArray())
            {
                var entryType = GetString(entry, "type");

                if (entryType == "airport")
                {
                    AddAirportSuggestion(suggestions, entry, GetString(entry, "subtitle"));
                }
                else if (entry.TryGetProperty("list", out var nearbyAirports) && nearbyAirports.ValueKind == JsonValueKind.Array)
                {
                    // A city / place entry. Its "list" holds the airports that serve it.
                    var placeTitle = GetString(entry, "title");

                    foreach (var nearby in nearbyAirports.EnumerateArray())
                    {
                        if (GetString(nearby, "type") == "airport")
                        {
                            AddAirportSuggestion(suggestions, nearby, placeTitle);
                        }
                    }
                }

                if (suggestions.Count >= MaxAirportSuggestions)
                {
                    break;
                }
            }

            if (suggestions.Count > MaxAirportSuggestions)
            {
                suggestions.RemoveRange(MaxAirportSuggestions, suggestions.Count - MaxAirportSuggestions);
            }

            _memoryCache.Set(cacheKey, suggestions, AirportCacheDuration);

            return suggestions;
        }

        private static void AddAirportSuggestion(List<AirportSuggestionDto> suggestions, JsonElement airport, string description)
        {
            var code = GetString(airport, "id").ToUpperInvariant();

            // Only real IATA codes (3 letters). City ids like "/m/09949m" are skipped.
            if (code.Length != 3 || !code.All(char.IsLetter))
            {
                return;
            }

            foreach (var existing in suggestions)
            {
                if (existing.Code == code)
                {
                    return;
                }
            }

            suggestions.Add(new AirportSuggestionDto
            {
                Code = code,
                Name = GetString(airport, "title"),
                City = GetString(airport, "city"),
                Description = description
            });
        }

        private static string GetString(JsonElement element, string propertyName)
        {
            if (element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String)
            {
                return value.GetString() ?? "";
            }

            return "";
        }

        public Task<string> GetLocationsAsync()
        {
            throw new NotImplementedException();
        }

        private static string GetCacheKey(Guid searchFlightId)
        {
            return "searchFlight:" + searchFlightId;
        }

        // "TK 1865" -> "TK"
        private static string GetAirlineCode(JsonElement leg)
        {
            var flightNumber = leg.GetProperty("flight_number").GetString() ?? "";
            return flightNumber.Split(' ')[0].ToUpperInvariant();
        }

        private static string GetAirlineName(string airlineCode)
        {
            return airlineCode switch
            {
                "TK" => "Turkish Airlines",
                "PC" => "Pegasus",
                "VF" => "AJet",
                _ => airlineCode
            };
        }

        // "Kayseri Erkilet Airport (ASR)" -> "Kayseri Erkilet Airport". The code is already shown next to the name.
        private static string CleanAirportName(string airportName, string airportCode)
        {
            var suffix = " (" + airportCode + ")";

            if (airportName.EndsWith(suffix))
            {
                return airportName.Substring(0, airportName.Length - suffix.Length);
            }

            return airportName;
        }

        // "2026-10-10 04:25" -> "04:25"
        private static string GetClockTime(string? providerTime)
        {
            if (string.IsNullOrWhiteSpace(providerTime))
            {
                return "";
            }

            var parts = providerTime.Split(' ');
            return parts[parts.Length - 1];
        }

        // 160 -> "2 sa 40 dk" (the format the SearchResults duration filter parses)
        private static string FormatDuration(int totalMinutes)
        {
            var hours = totalMinutes / 60;
            var minutes = totalMinutes % 60;

            if (hours == 0)
            {
                return minutes + " dk";
            }

            if (minutes == 0)
            {
                return hours + " sa";
            }

            return hours + " sa " + minutes + " dk";
        }

        private static string MapCabinToTravelClass(string cabin)
        {
            return cabin switch
            {
                "Premium" => "PREMIUM_ECONOMY",
                "Business" => "BUSINESS",
                "First" => "FIRST",
                _ => "ECONOMY"
            };
        }
    }
}
