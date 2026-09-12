using FluentValidation;
using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Validators.Reservations
{
    // Request shape only. Prices and names come from ReservationService.
    public class ReservationBaggageSelectionDtoValidator : AbstractValidator<ReservationBaggageSelectionDto>
    {
        private static readonly string[] CabinBaggageTypes = { "personal", "cabin-s", "cabin-l" };
        private static readonly int[] CheckedBaggageKgOptions = { 0, 12, 20, 30, 50 };

        public ReservationBaggageSelectionDtoValidator()
        {
            RuleFor(x => x.CabinBaggageType)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Kabin bagajı seçimi gereklidir.")
                .Must(type => CabinBaggageTypes.Contains(type))
                .WithMessage("Geçersiz kabin bagajı seçimi.");

            RuleFor(x => x.CheckedBaggageKg)
                .Must(kg => CheckedBaggageKgOptions.Contains(kg))
                .WithMessage("Geçersiz uçak altı bagaj seçimi.");
        }
    }
}
