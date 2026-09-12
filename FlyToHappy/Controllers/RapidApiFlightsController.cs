using FlyToHappy.Dtos.Flights;
using FlyToHappy.Services.RapidApiServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;

namespace FlyToHappy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RapidApiFlightsController : ControllerBase
    {
        
        private readonly IRapidApiFlightService _flightService;
        private readonly IValidator<FlightSearchRequestDto> _searchValidator;

        public RapidApiFlightsController(IRapidApiFlightService flightService, IValidator<FlightSearchRequestDto> searchValidator)
        {
            _flightService = flightService;
            _searchValidator = searchValidator;
        }


        /// <summary>
        /// Demo endpoint: RapidAPI'den sabit bir örnek uçuş cevabını ham JSON olarak döndürür. Uygulama tarafından kullanılmaz.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetFlight()
        {
            var result = await _flightService.GetDemoFlightAsync();

            return Content(result, "application/json");
        }

        /// <summary>
        /// Uçuş araması yapar. IATA kodu (örnek: IST, FCO), tarih ve kabin bilgisine göre
        /// RapidAPI'den izinli havayollarının (TK, PC, VF) tüm uçuşlarını döndürür. Sonuçlar 60 dakika cache'te tutulur.
        /// </summary>
        // GET /api/RapidApiFlights/search?from=IST&to=FCO&date=2026-10-10&cabin=Economy
        [HttpGet("search")]
        public async Task<ActionResult<List<SearchFlightDto>>> Search([FromQuery] FlightSearchRequestDto request)
        {
            var validationResult = await _searchValidator.ValidateAsync(request);

            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    message = "Girilen bilgiler geçersiz.",
                    errors = validationResult.Errors.Select(e => e.ErrorMessage).Distinct().ToList()
                });
            }

            var cabin = string.IsNullOrWhiteSpace(request.Cabin) ? "Economy" : request.Cabin;

            var flights = await _flightService.SearchFlightsAsync(request.From.ToUpperInvariant(), request.To.ToUpperInvariant(), request.Date, cabin);

            return Ok(flights);
        }

        /// <summary>
        /// Havalimanı / şehir autocomplete. Yazılan metne göre havalimanı önerileri (IATA kodu ve ad) döndürür.
        /// </summary>
        /// <param name="query">Aranan şehir veya havalimanı adı. En az 2 karakter; daha kısa ise boş liste döner.</param>
        // GET /api/RapidApiFlights/airports?query=istanbul
        [HttpGet("airports")]
        public async Task<ActionResult<List<AirportSuggestionDto>>> Airports(string query)
        {
            // Less than 2 characters: nothing to search yet, and no provider call.
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            {
                return Ok(new List<AirportSuggestionDto>());
            }

            var airports = await _flightService.SearchAirportsAsync(query);

            return Ok(airports);
        }



    }






}
