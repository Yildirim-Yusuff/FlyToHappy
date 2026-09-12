using FluentValidation;
using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Validators.Reservations
{
    // Used by "Seyahatlerim" and check-in lookup. Whether the PNR exists is checked in the service.
    public class TripLookupDtoValidator : AbstractValidator<TripLookupDto>
    {
        public TripLookupDtoValidator()
        {
            RuleFor(x => x.Pnr)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("PNR gereklidir.")
                .Must(pnr => pnr.Trim().Length == 6)
                .WithMessage("PNR 6 karakter olmalıdır.");

            RuleFor(x => x.Surname)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Soyad gereklidir.")
                .MaximumLength(50)
                .WithMessage("Soyad en fazla 50 karakter olabilir.");
        }
    }
}
