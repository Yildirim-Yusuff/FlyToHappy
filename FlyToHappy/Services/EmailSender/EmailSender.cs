
using SendGrid;
using SendGrid.Helpers.Mail;

namespace FlyToHappy.Services.EmailSender
{
    public class EmailSender : IEmailSender
    {

        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }





        // SendGrid üzerinden düz yazı (plain text) mail gönderir.
        public async Task SendEmailAsync(string email, string subject, string message)
        {
            var apiKey = _configuration["APIs:SendGridApi"];

            var client = new SendGridClient(apiKey);

            var from = new EmailAddress("josef.61amket@gmail.com", "FlyToHappy");

            var to = new EmailAddress(email);

            // message = düz yazı içerik, null = HTML içerik kullanmıyoruz.
            var mail = MailHelper.CreateSingleEmail(from, to, subject, message, null);

            var response = await client.SendEmailAsync(mail);

            // SendGrid hata durumunda exception fırlatmaz, cevap kodunu kendimiz kontrol ediyoruz.
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                throw new Exception("SendGrid maili kabul etmedi. Durum kodu: " + response.StatusCode + " " + errorBody);
            }
        }
    }
}
