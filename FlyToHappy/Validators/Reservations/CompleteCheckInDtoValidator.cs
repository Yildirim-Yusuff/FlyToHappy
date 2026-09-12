using FluentValidation;
using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Validators.Reservations
{
    // Request format only. Ownership, occupied seat and "already checked in" stay in the service.
    public class CompleteCheckInDtoValidator : AbstractValidator<CompleteCheckInDto>
    {
        public CompleteCheckInDtoValidator()
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

            RuleFor(x => x.PassengerId)
                .NotEmpty()
                .WithMessage("Yolcu seçimi gereklidir.");

            RuleFor(x => x.FlightId)
                .GreaterThan(0)
                .WithMessage("Uçuş seçimi gereklidir.");

            // Demo seat map: rows 1-30, seats A-F (e.g. 12A).
            RuleFor(x => x.SeatNumber)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Koltuk seçimi gereklidir.")
                .Must(seat => System.Text.RegularExpressions.Regex.IsMatch(seat.Trim(), "^([1-9]|[12][0-9]|30)[A-Fa-f]$"))
                .WithMessage("Lütfen geçerli bir koltuk seçin.");
        }
    }
}
