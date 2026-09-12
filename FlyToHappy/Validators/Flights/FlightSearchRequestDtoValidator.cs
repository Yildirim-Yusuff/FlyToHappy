using System.Globalization;
using FluentValidation;
using FlyToHappy.Dtos.Flights;

namespace FlyToHappy.Validators.Flights
{
    public class FlightSearchRequestDtoValidator : AbstractValidator<FlightSearchRequestDto>
    {
        private static readonly string[] Cabins = { "Economy", "Premium", "Business", "First" };

        public FlightSearchRequestDtoValidator()
        {
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

            RuleFor(x => x.Date)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Uçuş tarihi gereklidir.")
                .Must(BeAValidDate)
                .WithMessage("Uçuş tarihi yyyy-MM-dd biçiminde olmalıdır.")
                .Must(NotBeInThePast)
                .WithMessage("Uçuş tarihi geçmiş bir gün olamaz.");

            // Empty cabin is allowed; the controller falls back to Economy.
            RuleFor(x => x.Cabin)
                .Must(cabin => string.IsNullOrWhiteSpace(cabin) || Cabins.Contains(cabin))
                .WithMessage("Kabin sınıfı Economy, Premium, Business veya First olmalıdır.");
        }

        private static bool BeAValidDate(string value)
        {
            return DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);
        }

        private static bool NotBeInThePast(string value)
        {
            if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                return true; // format error is reported by the rule above
            }

            return date >= DateOnly.FromDateTime(DateTime.Today);
        }
    }
}
