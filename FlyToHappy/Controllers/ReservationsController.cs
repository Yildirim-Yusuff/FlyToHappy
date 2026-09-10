using FlyToHappy.Dtos.Reservations;
using FlyToHappy.Services.ReservationServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {

        private readonly IReservationService _reservationService;



        public ReservationsController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }


        [HttpPost("trip")]
        public async Task<ActionResult<TripDetailDto>> GetTrip(TripLookupDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Pnr) || string.IsNullOrWhiteSpace(dto.Surname))
                return BadRequest(new { message = "PNR ve soyad gereklidir." });
            var trip = await _reservationService.GetTripAsync(dto);
            if (trip == null) return NotFound(new { message = "PNR veya soyad ile eşleşen rezervasyon bulunamadı." });
            return Ok(trip);
        }

        [HttpPost("check-in/lookup")]
        public async Task<ActionResult<CheckInLookupDto>> GetCheckIn(TripLookupDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Pnr) || string.IsNullOrWhiteSpace(dto.Surname))
                return BadRequest(new { message = "PNR ve soyad gereklidir." });
            var result = await _reservationService.GetCheckInAsync(dto);
            if (result == null) return NotFound(new { message = "PNR veya soyad ile eşleşen rezervasyon bulunamadı." });
            return Ok(result);
        }

        [HttpPost("check-in")]
        public async Task<ActionResult<BoardingPassDto>> CompleteCheckIn(CompleteCheckInDto dto)
        {
            try
            {
                return Ok(await _reservationService.CompleteCheckInAsync(dto));
            }
            catch (KeyNotFoundException exception)
            {
                return NotFound(new { message = exception.Message });
            }
            catch (ArgumentException exception)
            {
                return BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Conflict(new { message = exception.Message });
            }
        }

        [HttpGet("flight-status")]
        public async Task<ActionResult<FlightStatusDto>> GetFlightStatus(string flightNumber, DateOnly date)
        {
            if (string.IsNullOrWhiteSpace(flightNumber) || date == default)
                return BadRequest(new { message = "Uçuş numarası ve tarih gereklidir." });
            var result = await _reservationService.GetFlightStatusAsync(flightNumber, date);
            if (result == null) return NotFound(new { message = "Bu uçuş numarası ve tarih için kayıtlı uçuş bulunamadı." });
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ReservationDetailDto>> GetReservation(Guid id)
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id);
            if (reservation is null)
            {
                return NotFound();
            }

            return Ok(reservation);
        }

        [HttpPost]
        public async Task<ActionResult<ReservationCreatedDto>> CreateReservation(CreateReservationDto dto)
        {
            var result = await _reservationService.CreateReservationAsync(dto);

            return Ok(result);
        }


    }


}
