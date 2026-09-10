using FlyToHappy.Data;
using FlyToHappy.Mapping;
using FlyToHappy.Services.RapidApiServices;
using FlyToHappy.Services.ReservationServices;
using FlyToHappy.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SqlName")));


builder.Services.Configure<RapidApiSettings>(
    builder.Configuration.GetSection("RapidApi"));

builder.Services.AddMemoryCache();


builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddAutoMapper(cfg => { }, typeof(GeneralMapping));
builder.Services.AddHttpClient<IRapidApiFlightService, RapidApiFlightService>();





var app = builder.Build();






// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Default}/{action=Index}/{id?}");

app.Run();
