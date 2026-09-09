namespace FlyToHappy.Dtos.Reservations
{
    public class ReservationPriceSummaryDto
    {
        public decimal DepartureFlightPrice { get; set; }
        public decimal ReturnFlightPrice { get; set; }
        public decimal CabinBaggagePrice { get; set; }
        public decimal CheckedBaggagePrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
