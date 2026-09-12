using FluentValidation;
using FlyToHappy.Dtos.Reservations;

namespace FlyToHappy.Validators.Reservations
{
    public class PassengerInfoDtoValidator : AbstractValidator<PassengerInfoDto>
    {
        private static readonly string[] PassengerTypes = { "Yetişkin", "Çocuk", "Bebek" };
        private static readonly string[] Genders = { "Male", "Female" };

        public PassengerInfoDtoValidator()
        {
            RuleFor(x => x.PassengerType)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Yolcu tipi gereklidir.")
                .Must(type => PassengerTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
                .WithMessage("Yolcu tipi Yetişkin, Çocuk veya Bebek olmalıdır.");

            RuleFor(x => x.FirstName)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Yolcu adı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("Yolcu adı en fazla 50 karakter olabilir.");

            RuleFor(x => x.LastName)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Yolcu soyadı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("Yolcu soyadı en fazla 50 karakter olabilir.");

            RuleFor(x => x.BirthDate)
                .NotEqual(default(DateOnly))
                .WithMessage("Doğum tarihi gereklidir.")
                .LessThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.Today))
                .WithMessage("Doğum tarihi gelecekte olamaz.");

            RuleFor(x => x.Gender)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Cinsiyet seçimi gereklidir.")
                .Must(gender => Genders.Contains(gender))
                .WithMessage("Geçersiz cinsiyet seçimi.");

            RuleFor(x => x.Nationality)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Uyruk seçimi gereklidir.")
                .Matches("^[A-Za-z]{2}$")
                .WithMessage("Uyruk iki harfli ülke kodu olmalıdır.");

            // Turkish citizens send an 11-digit national id; others tick NotTurkishCitizen.
            When(x => !x.NotTurkishCitizen, () =>
            {
                RuleFor(x => x.NationalId)
                    .Cascade(CascadeMode.Stop)
                    .NotEmpty()
                    .WithMessage("TC Kimlik No gereklidir.")
                    .Matches("^[0-9]{11}$")
                    .WithMessage("TC Kimlik No 11 rakamdan oluşmalıdır.");
            });

            When(x => x.HasPassport, () =>
            {
                RuleFor(x => x.PassportNumber)
                    .Cascade(CascadeMode.Stop)
                    .NotEmpty()
                    .WithMessage("Pasaport numarası gereklidir.")
                    .MaximumLength(20)
                    .WithMessage("Pasaport numarası en fazla 20 karakter olabilir.");

                RuleFor(x => x.PassportExpiryDate)
                    .Cascade(CascadeMode.Stop)
                    .NotNull()
                    .WithMessage("Pasaport son geçerlilik tarihi gereklidir.")
                    .GreaterThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.Today))
                    .WithMessage("Pasaport son geçerlilik tarihi geçmiş olamaz.");
            });
        }
    }
}
