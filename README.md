# FlyToHappy

ASP.NET Core MVC ile geliştirilmiş uçuş arama ve rezervasyon uygulaması.
Gerçek uçuş verisi RapidAPI (Google Flights) üzerinden gelir; rezervasyon, check-in ve kullanıcı işlemleri SQL Server'da tutulur.

## Özellikler

- Uçuş arama (One Way / Round Trip) — RapidAPI entegrasyonu
- Havalimanı / şehir autocomplete (kullanıcı adı görür, sisteme IATA kodu gider)
- Rezervasyon oluşturma (backend fiyat hesabı, PNR üretimi, bagaj seçimi)
- Demo ödeme ekranı ve rezervasyon başarı sayfası
- Identity Cookie Authentication (kayıt / giriş / çıkış)
- User / Admin rolleri ve admin seed
- FluentValidation ile Türkçe istek doğrulama
- Global Error Handling + Logging (`/api` için tek biçim JSON hata)
- Email Service (SendGrid — rezervasyon ve check-in bilgi maili)
- Seyahatlerim (PNR + soyad ile sorgu)
- Demo Check-in ve koltuk seçimi
- Demo Boarding Pass (PNG indirme)
- Uçuş durumu sorgusu
- Swagger / API dokümantasyonu

## Kullanılan Teknolojiler

- ASP.NET Core MVC / .NET 8
- Entity Framework Core 8 + SQL Server
- ASP.NET Core Identity
- AutoMapper
- FluentValidation
- SendGrid
- Swashbuckle (Swagger)
- RapidAPI Google Flights2 (HttpClient + IMemoryCache)
- Razor Views, Bootstrap 5, Vanilla JavaScript

## Projeyi Çalıştırma

1. Repoyu klonla:

   ```bash
   git clone https://github.com/Yildirim-Yusuff/FlyToHappy.git
   cd FlyToHappy/FlyToHappy
   ```

2. Paketleri yükle:

   ```bash
   dotnet restore
   ```

3. User Secrets değerlerini gir (aşağıya bak).

4. Veritabanını oluştur (migration'lar projede hazır):

   ```bash
   dotnet ef database update
   ```

5. Uygulamayı çalıştır:

   ```bash
   dotnet run
   ```

   Varsayılan adres: `http://localhost:5012` (bkz. `Properties/launchSettings.json`).

## User Secrets

Gizli değerler kaynak kodda veya `appsettings.json` içinde tutulmaz; .NET User Secrets kullanılır.
Proje klasöründe (`FlyToHappy/FlyToHappy`) aşağıdaki anahtarları kendi değerlerinle gir:

```bash
dotnet user-secrets set "ConnectionStrings:SqlName" "Server=.;Database=FlyToHappyDb;Trusted_Connection=True;TrustServerCertificate=True"
dotnet user-secrets set "RapidApi:Key" "<rapidapi-key>"
dotnet user-secrets set "APIs:SendGridApi" "<sendgrid-api-key>"
dotnet user-secrets set "AdminSeed:Email" "admin@example.com"
dotnet user-secrets set "AdminSeed:Password" "<guclu-bir-sifre>"
```

| Anahtar | Ne için |
|---|---|
| `ConnectionStrings:SqlName` | SQL Server bağlantısı |
| `RapidApi:Key` | RapidAPI Google Flights2 anahtarı (`RapidApi:Host` `appsettings.json` içindedir) |
| `APIs:SendGridApi` | SendGrid API anahtarı (mail gönderimi) |
| `AdminSeed:Email` / `AdminSeed:Password` | İlk açılışta oluşturulan Admin kullanıcısı (boşsa admin seed atlanır, roller yine oluşur) |

## Swagger

Uygulama çalışırken: `/swagger`

API dokümanı: `/swagger/v1/swagger.json`

## Notlar

- **Ödeme demodur.** Gerçek ödeme sağlayıcısı yoktur; kart bilgileri backend'e gönderilmez ve saklanmaz.
- **Check-in ve boarding pass demodur.** Havayolu sistemine iletilmez, gerçek uçuşta geçerli değildir.
- **SendGrid:** mail gönderimi için SendGrid panelinde gönderici adresinin doğrulanması (Single Sender Verification) gerekir.
  Doğrulanmadan gönderim 403 döner; rezervasyon / check-in işlemi bundan etkilenmez, hata sadece loglanır.
- **RapidAPI:** aynı arama ilk isteklerde boş dönebilir (sağlayıcı soğuk cache); arama sonuçları 60 dakika bellekte tutulur.
  Ücretsiz plan aylık 150 istekle sınırlıdır; kota dolunca sağlayıcı 429 döner ve arama ekranı "Uçuşlar yüklenemedi" gösterir (uygulama hatası değildir).
- Rate limiting, JWT, admin paneli ve gerçek ödeme entegrasyonu bu sürümde yoktur; gelecek geliştirme olarak planlanmıştır.
