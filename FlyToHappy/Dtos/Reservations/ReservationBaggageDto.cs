namespace FlyToHappy.Dtos.Reservations
{
    public class ReservationBaggageDto
    {
        public ReservationBaggageOptionDto CabinBaggage { get; set; } = new();
        public ReservationBaggageOptionDto CheckedBaggage { get; set; } = new();
    }
}
