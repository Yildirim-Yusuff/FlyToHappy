using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Services.ReservationServices
{
    public interface IReservationService
    {
        Task<ReservationCreatedDto> CreateReservationAsync(CreateReservationDto dto);
        Task<ReservationDetailDto?> GetReservationByIdAsync(Guid reservationId);
    }
}
