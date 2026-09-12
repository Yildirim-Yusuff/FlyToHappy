using FluentValidation;
using FlyToHappy.Data;
using FlyToHappy.Mapping;
using FlyToHappy.Models;
using FlyToHappy.Services.EmailSender;
using FlyToHappy.Services.RapidApiServices;
using FlyToHappy.Services.ReservationServices;
using FlyToHappy.Settings;
using FlyToHappy.Validators.Auth;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Request DTOs are validated with FluentValidation (see Validators/). Without this flag MVC would
// also treat every non-nullable string property as [Required] and answer before our validators run.
builder.Services.AddControllersWithViews(options =>
{
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
});


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlName")));

builder.Services.AddIdentity<AppUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Identity cookie settings. API calls under /api get 401/403 instead of a redirect
// to a login page that does not exist in this project.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.SlidingExpiration = true;

    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();


builder.Services.Configure<RapidApiSettings>(
    builder.Configuration.GetSection("RapidApi"));

builder.Services.AddMemoryCache();


builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddAutoMapper(cfg => { }, typeof(GeneralMapping));
builder.Services.AddHttpClient<IRapidApiFlightService, RapidApiFlightService>();
builder.Services.AddScoped<IEmailSender, EmailSender>();

// Swagger: API endpoint'lerini tarayıp /swagger/v1/swagger.json dokümanını üretir.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "FlyToHappy API",
        Description = "FlyToHappy uçuş arama, rezervasyon, check-in ve kullanıcı işlemleri."
    });

    // Controller'lardaki /// <summary> yorumları build sırasında FlyToHappy.xml dosyasına yazılır
    // (csproj: GenerateDocumentationFile). Swagger bu dosyayı okuyup açıklamaları UI'da gösterir.
    var xmlPath = Path.Combine(AppContext.BaseDirectory, "FlyToHappy.xml");
    options.IncludeXmlComments(xmlPath);
});




var app = builder.Build();






// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // MVC pages keep the project's existing error page in production.
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// API exceptions use one JSON handler in every environment.
app.UseWhen(context => context.Request.Path.StartsWithSegments("/api"), apiApp =>
{
    apiApp.UseExceptionHandler(new ExceptionHandlerOptions
    {
        AllowStatusCode404Response = true,
        ExceptionHandler = async context =>
        {
            var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

            var statusCode = exception switch
            {
                ArgumentException => StatusCodes.Status400BadRequest,
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                _ => StatusCodes.Status500InternalServerError
            };

            var message = statusCode == StatusCodes.Status500InternalServerError
                ? "Beklenmeyen bir sunucu hatası oluştu."
                : exception?.Message ?? "İşlem tamamlanamadı.";

            if (statusCode == StatusCodes.Status500InternalServerError)
            {
                app.Logger.LogError(exception, "Beklenmeyen API hatası. Path: {Path}", context.Request.Path);
            }
            else
            {
                app.Logger.LogWarning(
                    "API hatası. Status: {StatusCode}, Path: {Path}, Message: {Message}",
                    statusCode,
                    context.Request.Path,
                    message);
            }

            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsJsonAsync(new { statusCode, message });
        }
    });
});

using (var scope = app.Services.CreateScope())
{
    await IdentitySeed.SeedAsync(
        scope.ServiceProvider,
        builder.Configuration);
}

// Swagger: /swagger/v1/swagger.json (doküman) ve /swagger (UI sayfası).
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "FlyToHappy API v1");
});

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Default}/{action=Index}/{id?}");

app.Run();
