namespace FlyToHappy.Dtos.Reservations
{
    public class ReservationCreatedDto
    {
        public Guid ReservationId { get; set; }
        public string Pnr { get; set; } = string.Empty;
    }
}
