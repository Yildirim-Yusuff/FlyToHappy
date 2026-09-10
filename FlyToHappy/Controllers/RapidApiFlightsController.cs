using FlyToHappy.Dtos.Flights;
using FlyToHappy.Services.RapidApiServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RapidApiFlightsController : ControllerBase
    {
        
        private readonly IRapidApiFlightService _flightService;

        public RapidApiFlightsController(IRapidApiFlightService flightService)
        {
            _flightService = flightService;
        }


        [HttpGet]
        public async Task<IActionResult> GetFlight()
        {
            var result = await _flightService.GetDemoFlightAsync();

            return Content(result, "application/json");
        }

        // GET /api/RapidApiFlights/search?from=IST&to=FCO&date=2026-10-10&cabin=Economy
        [HttpGet("search")]
        public async Task<ActionResult<List<SearchFlightDto>>> Search(string from, string to, string date, string cabin)
        {
            if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(to) || string.IsNullOrWhiteSpace(date))
            {
                return BadRequest("from, to ve date parametreleri zorunludur.");
            }

            if (string.IsNullOrWhiteSpace(cabin))
            {
                cabin = "Economy";
            }

            var flights = await _flightService.SearchFlightsAsync(from, to, date, cabin);

            return Ok(flights);
        }

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
