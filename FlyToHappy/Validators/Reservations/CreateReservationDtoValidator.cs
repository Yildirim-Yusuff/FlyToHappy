using FluentValidation;
using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Validators.Reservations
{
    // Request shape and basic rules. Cache lookups, pricing and PNR stay in ReservationService.
    public class CreateReservationDtoValidator : AbstractValidator<CreateReservationDto>
    {
        private static readonly string[] TripTypes = { "oneWay", "roundTrip" };
        private static readonly string[] Cabins = { "Economy", "Premium", "Business", "First" };

        public CreateReservationDtoValidator()
        {
            RuleFor(x => x.TripType)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Seyahat tipi gereklidir.")
                .Must(type => TripTypes.Contains(type))
                .WithMessage("Seyahat tipi oneWay veya roundTrip olmalıdır.");

            RuleFor(x => x.From)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Kalkış havalimanı gereklidir.")
                .Matches("^[A-Za-z]{3}$")
                .WithMessage("Kalkış havalimanı 3 harfli IATA kodu olmalıdır.");

            RuleFor(x => x.To)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Varış havalimanı gereklidir.")
                .Matches("^[A-Za-z]{3}$")
                .WithMessage("Varış havalimanı 3 harfli IATA kodu olmalıdır.")
                .NotEqual(x => x.From, StringComparer.OrdinalIgnoreCase)
                .WithMessage("Kalkış ve varış havalimanı aynı olamaz.");

            RuleFor(x => x.DepartureDate)
                .NotEqual(default(DateOnly))
                .WithMessage("Gidiş tarihi gereklidir.");

            RuleFor(x => x.Cabin)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Kabin sınıfı gereklidir.")
                .Must(cabin => Cabins.Contains(cabin))
                .WithMessage("Kabin sınıfı Economy, Premium, Business veya First olmalıdır.");

            RuleFor(x => x.DepartureSearchFlightId)
                .NotEmpty()
                .WithMessage("Gidiş uçuşu seçilmelidir.");

            When(x => x.TripType == "roundTrip", () =>
            {
                RuleFor(x => x.ReturnDate)
                    .NotNull()
                    .WithMessage("Dönüş tarihi gereklidir.")
                    .GreaterThanOrEqualTo(x => x.DepartureDate)
                    .WithMessage("Dönüş tarihi gidiş tarihinden önce olamaz.");

                RuleFor(x => x.ReturnSearchFlightId)
                    .NotNull()
                    .WithMessage("Dönüş uçuşu seçilmelidir.")
                    .NotEqual(Guid.Empty)
                    .WithMessage("Dönüş uçuşu seçilmelidir.");
            });

            RuleFor(x => x.ContactFirstName)
                .NotEmpty()
                .WithMessage("İletişim adı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("İletişim adı en fazla 50 karakter olabilir.");

            RuleFor(x => x.ContactLastName)
                .NotEmpty()
                .WithMessage("İletişim soyadı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("İletişim soyadı en fazla 50 karakter olabilir.");

            RuleFor(x => x.ContactEmail)
                .NotEmpty()
                .WithMessage("İletişim e-postası gereklidir.")
                .EmailAddress()
                .WithMessage("Geçerli bir e-posta adresi giriniz.");

            RuleFor(x => x.ContactPhone)
                .NotEmpty()
                .WithMessage("İletişim telefonu gereklidir.")
                .MaximumLength(20)
                .WithMessage("Telefon numarası en fazla 20 karakter olabilir.");

            RuleFor(x => x.Passengers)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("En az bir yolcu eklenmelidir.")
                .Must(passengers => passengers.All(passenger => passenger != null))
                .WithMessage("Yolcu bilgileri boş olamaz.");

            RuleForEach(x => x.Passengers)
                .SetValidator(new PassengerInfoDtoValidator());

            RuleFor(x => x.BaggageSelection)
                .NotNull()
                .WithMessage("Bagaj seçimi gereklidir.")
                .SetValidator(new ReservationBaggageSelectionDtoValidator());
        }
    }
}
