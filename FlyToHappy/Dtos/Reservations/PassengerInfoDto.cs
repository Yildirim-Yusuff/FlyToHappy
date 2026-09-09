namespace FlyToHappy.Dtos.Reservations
{
    public class PassengerInfoDto
    {
        public string PassengerType { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateOnly BirthDate { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Nationality { get; set; } = string.Empty;
        public string? NationalId { get; set; }
        public bool NotTurkishCitizen { get; set; }
        public bool HasPassport { get; set; }
        public string? PassportNumber { get; set; }
        public DateOnly? PassportExpiryDate { get; set; }
    }
}
