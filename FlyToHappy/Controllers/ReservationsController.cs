using FlyToHappy.Dtos.Reservations;
using FlyToHappy.Services.ReservationServices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;

namespace FlyToHappy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {

        private readonly IReservationService _reservationService;
        private readonly IValidator<TripLookupDto> _tripLookupValidator;
        private readonly IValidator<CompleteCheckInDto> _checkInValidator;
        private readonly IValidator<CreateReservationDto> _createReservationValidator;

        public ReservationsController(
            IReservationService reservationService,
            IValidator<TripLookupDto> tripLookupValidator,
            IValidator<CompleteCheckInDto> checkInValidator,
            IValidator<CreateReservationDto> createReservationValidator)
        {
            _reservationService = reservationService;
            _tripLookupValidator = tripLookupValidator;
            _checkInValidator = checkInValidator;
            _createReservationValidator = createReservationValidator;
        }

        // Same error shape for every validation failure: { message, errors: [...] }
        private BadRequestObjectResult ValidationFailed(FluentValidation.Results.ValidationResult validationResult)
        {
            return BadRequest(new
            {
                message = "Girilen bilgiler geçersiz.",
                errors = validationResult.Errors.Select(e => e.ErrorMessage).Distinct().ToList()
            });
        }


        /// <summary>
        /// Seyahatlerim: PNR ve yolcu soyadı ile rezervasyon detayını getirir. Eşleşme yoksa 404 döner.
        /// </summary>
        [HttpPost("trip")]
        public async Task<ActionResult<TripDetailDto>> GetTrip(TripLookupDto dto)
        {
            var validationResult = await _tripLookupValidator.ValidateAsync(dto);
            if (!validationResult.IsValid) return ValidationFailed(validationResult);
            var trip = await _reservationService.GetTripAsync(dto);
            if (trip == null) return NotFound(new { message = "PNR veya soyad ile eşleşen rezervasyon bulunamadı." });
            return Ok(trip);
        }

        /// <summary>
        /// Check-in sorgusu: PNR ve soyad ile yolcu listesini ve demo koltuk planını getirir.
        /// </summary>
        [HttpPost("check-in/lookup")]
        public async Task<ActionResult<CheckInLookupDto>> GetCheckIn(TripLookupDto dto)
        {
            var validationResult = await _tripLookupValidator.ValidateAsync(dto);
            if (!validationResult.IsValid) return ValidationFailed(validationResult);
            var result = await _reservationService.GetCheckInAsync(dto);
            if (result == null) return NotFound(new { message = "PNR veya soyad ile eşleşen rezervasyon bulunamadı." });
            return Ok(result);
        }

        /// <summary>
        /// Demo check-in yapar: seçilen koltuğu kaydeder ve biniş kartı (boarding pass) bilgisini döndürür.
        /// Koltuk doluysa veya yolcu zaten check-in yaptıysa 409 döner.
        /// </summary>
        [HttpPost("check-in")]
        public async Task<ActionResult<BoardingPassDto>> CompleteCheckIn(CompleteCheckInDto dto)
        {
            var validationResult = await _checkInValidator.ValidateAsync(dto);
            if (!validationResult.IsValid) return ValidationFailed(validationResult);

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

        /// <summary>
        /// Uçuş durumu: veritabanında kayıtlı (rezerve edilmiş) bir uçuşun planlı saat ve rota bilgisini döndürür.
        /// </summary>
        /// <param name="flightNumber">Uçuş numarası (örnek: TK1861).</param>
        /// <param name="date">Uçuş tarihi (yyyy-MM-dd).</param>
        [HttpGet("flight-status")]
        public async Task<ActionResult<FlightStatusDto>> GetFlightStatus(string flightNumber, DateOnly date)
        {
            if (string.IsNullOrWhiteSpace(flightNumber) || date == default)
                return BadRequest(new { message = "Uçuş numarası ve tarih gereklidir." });
            var result = await _reservationService.GetFlightStatusAsync(flightNumber, date);
            if (result == null) return NotFound(new { message = "Bu uçuş numarası ve tarih için kayıtlı uçuş bulunamadı." });
            return Ok(result);
        }

        /// <summary>
        /// Rezervasyon detayını Id ile getirir (rezervasyon başarı sayfası bunu kullanır).
        /// </summary>
        /// <param name="id">Rezervasyon Id (GUID).</param>
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

        /// <summary>
        /// Yeni rezervasyon oluşturur. Uçuş, aramadan gelen SearchFlightId ile bulunur; fiyat sunucuda hesaplanır,
        /// PNR sunucuda üretilir. Arama süresi dolmuşsa 400 döner.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ReservationCreatedDto>> CreateReservation(CreateReservationDto dto)
        {
            var validationResult = await _createReservationValidator.ValidateAsync(dto);
            if (!validationResult.IsValid) return ValidationFailed(validationResult);

            var result = await _reservationService.CreateReservationAsync(dto);

            return Ok(result);
        }


    }


}
