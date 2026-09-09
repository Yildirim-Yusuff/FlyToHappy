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
