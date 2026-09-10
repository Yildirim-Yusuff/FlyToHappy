using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Services.ReservationServices
{
    public interface IReservationService
    {
        Task<ReservationCreatedDto> CreateReservationAsync(CreateReservationDto dto);
        Task<ReservationDetailDto?> GetReservationByIdAsync(Guid reservationId);
        Task<TripDetailDto?> GetTripAsync(TripLookupDto dto);
        Task<CheckInLookupDto?> GetCheckInAsync(TripLookupDto dto);
        Task<BoardingPassDto> CompleteCheckInAsync(CompleteCheckInDto dto);
        Task<FlightStatusDto?> GetFlightStatusAsync(string flightNumber, DateOnly date);
    }
}
