namespace FlyToHappy.Models
{
    public class DemoCheckIn
    {
        public Guid DemoCheckInId { get; set; } = Guid.NewGuid();
        public Guid PassengerId { get; set; }
        public Passenger Passenger { get; set; } = null!;
        public int FlightId { get; set; }
        public Flight Flight { get; set; } = null!;
        public bool IsCheckedIn { get; set; }
        public DateTime CheckInDate { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string BoardingPassNumber { get; set; } = string.Empty;
    }
}
