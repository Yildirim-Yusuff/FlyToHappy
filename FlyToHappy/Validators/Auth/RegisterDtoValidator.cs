using FluentValidation;
using FlyToHappy.Dtos.Authentication;

namespace FlyToHappy.Validators.Auth
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("Ad alanı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("Ad en fazla 50 karakter olabilir.");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .WithMessage("Soyad alanı boş bırakılamaz.")
                .MaximumLength(50)
                .WithMessage("Soyad en fazla 50 karakter olabilir.");

            RuleFor(x => x.Email)
                .NotEmpty()
                .WithMessage("E-posta alanı boş bırakılamaz.")
                .EmailAddress()
                .WithMessage("Geçerli bir e-posta adresi giriniz.");

            RuleFor(x => x.Password)
                .NotEmpty()
                .WithMessage("Şifre alanı boş bırakılamaz.")
                .MinimumLength(6)
                .WithMessage("Şifre en az 6 karakter olmalıdır.");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty()
                .WithMessage("Şifre tekrar alanı boş bırakılamaz.")
                .Equal(x => x.Password)
                .WithMessage("Şifreler eşleşmiyor.");
        }
    }
}
