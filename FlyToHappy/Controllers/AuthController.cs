using FlyToHappy.Dtos.Authentication;
using FlyToHappy.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FluentValidation;

namespace FlyToHappy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<AppUser> _signInManager;
        private readonly UserManager<AppUser> _userManager;
        private readonly IValidator<RegisterDto> _registerValidator;
        private readonly IValidator<LoginDto> _loginValidator;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            IValidator<RegisterDto> registerValidator,
            IValidator<LoginDto> loginValidator)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _registerValidator = registerValidator;
            _loginValidator = loginValidator;
        }

        /// <summary>
        /// Yeni kullanıcı kaydı oluşturur (ad, soyad, e-posta, şifre). Başarılı kayıtta "User" rolü atanır.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var validationResult = await _registerValidator.ValidateAsync(dto);

            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    message = "Girilen bilgiler geçersiz.",
                    errors = validationResult.Errors.Select(e => e.ErrorMessage).Distinct().ToList()
                });
            }


            var email = dto.Email.Trim();

            var existingUser = await _userManager.FindByEmailAsync(email);

            if (existingUser != null) 
            {
                return BadRequest(new
                {
                    message = "Bu e-posta adresi zaten kullanılıyor"
                });

            }



            var user = new AppUser
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                Email = email,
                UserName = email
            };


            var result = await _userManager.CreateAsync(user, dto.Password);


            if (!result.Succeeded) 
            {

                return BadRequest(new
                {
                    message = "Kullanıcı Oluşturulamadı",
                    errors = result.Errors.Select(x => x.Description)
                });


            }

            var roleResult = await _userManager.AddToRoleAsync(user, "User");

            if (!roleResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Kullanıcı oluşturuldu fakat rol atanamadı.",
                    errors = roleResult.Errors.Select(x => x.Description)
                });
            }


            return Ok(new
            {
                message = "Kayıt Başarılı"
            });


        }

        /// <summary>
        /// E-posta ve şifre ile giriş yapar. Başarılı girişte Identity cookie'si oluşturulur.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var validationResult = await _loginValidator.ValidateAsync(dto);

            if (!validationResult.IsValid)
            {
                return BadRequest(new
                {
                    message = "Girilen bilgiler geçersiz.",
                    errors = validationResult.Errors.Select(e => e.ErrorMessage).Distinct().ToList()
                });
            }

           var email = dto.Email.Trim();
           var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "E-posta bulunamadı veya şifre hatalı"
                });
            }

            var result = await _signInManager.PasswordSignInAsync(
                user,
                dto.Password,
                isPersistent: false,
                lockoutOnFailure: false
            );

            if (!result.Succeeded) 
            { 
                return Unauthorized(new
                {
                    message = "E-posta bulunamadı veya şifre hatalı"
                });

            }

            return Ok(new
            {
               message = "Giriş Başarılı",
               user = new {
                    
                    user.FirstName,
                    user.LastName,
                    user.Email

               }
            });

        }

        /// <summary>
        /// Oturumu kapatır ve Identity cookie'sini siler.
        /// </summary>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new
            {
                message = "Çıkış Başarılı"
            });
        }

        /// <summary>
        /// Giriş yapmış kullanıcının bilgilerini döndürür (ad, soyad, e-posta). Oturum yoksa 401 döner.
        /// </summary>
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null)
            {
                return Unauthorized(new {message = "Oturum bulunamadı."});
            }

            return Ok(new
            {
                user = new
                {
                    user.FirstName,
                    user.LastName,
                    user.Email
                }
            });
        }


        /// <summary>
        /// Admin rolü testi. Yalnız "Admin" rolündeki kullanıcı 200 alır; oturum yoksa 401, rol yoksa 403 döner.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("admin-test")]
        public IActionResult AdminTest()
        {
            return Ok(new
            {
                message = "Admin yetkisi başarılı."
            });
        }
    }
}  
