namespace FlyToHappy.Models
{
    public class Passenger
    {
        public Guid PassengerId { get; set; } = Guid.NewGuid(); 
        public string PassengerType { get; set; } = string.Empty;
        

        // =========================
        // Passenger Personal Information
        // =========================
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

       
        public DateOnly BirthDate { get; set; } 
        public string Gender { get; set; } = string.Empty;

       
        public string Nationality { get; set; } = string.Empty;
        public string? NationalId { get; set; }

    
        public bool NotTurkishCitizen { get; set; }

        // =========================
        // Passport Information
        // =========================
        public bool HasPassport { get; set; }
        public string? PassportNumber { get; set; }
        public DateOnly? PassportExpiryDate { get; set; }



        // =========================
        // Reservation Information
        // =========================
        public Guid ReservationId { get; set; }
        public Reservation Reservation { get; set; } = null!;
    }
}
