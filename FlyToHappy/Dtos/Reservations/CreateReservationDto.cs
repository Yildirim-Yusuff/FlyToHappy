namespace FlyToHappy.Dtos.Reservations
{
    public class CreateReservationDto
    {
        public string TripType { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string To { get; set; } = string.Empty;
        public DateOnly DepartureDate { get; set; }
        public DateOnly? ReturnDate { get; set; }
        public string Cabin { get; set; } = string.Empty;

        // Ids of flights picked on SearchResults. They point to the backend search cache,
        // not to SQL. The chosen flight is written to SQL only when the reservation is created.
        public Guid DepartureSearchFlightId { get; set; }
        public Guid? ReturnSearchFlightId { get; set; }

        public string ContactFirstName { get; set; } = string.Empty;
        public string ContactLastName { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;

        public List<PassengerInfoDto> Passengers { get; set; } = new();
        public ReservationBaggageSelectionDto BaggageSelection { get; set; } = new();
    }
}
