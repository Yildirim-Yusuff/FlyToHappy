using FlyToHappy.Data;
using FlyToHappy.Dtos.Flights;
using FlyToHappy.Dtos.Reservations;
using FlyToHappy.Models;
using FlyToHappy.Services.RapidApiServices;
using FlyToHappy.Services.EmailSender;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using System.Globalization;
using Microsoft.Data.SqlClient;
using System.Text.Json;

namespace FlyToHappy.Services.ReservationServices
{
    public class ReservationService : IReservationService
    {

        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly IRapidApiFlightService _rapidApiFlightService;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<ReservationService> _logger;

        public ReservationService(
            AppDbContext context,
            IMapper mapper,
            IRapidApiFlightService rapidApiFlightService,
            IEmailSender emailSender,
            ILogger<ReservationService> logger)
        {
            _context = context;
            _mapper = mapper;
            _rapidApiFlightService = rapidApiFlightService;
            _emailSender = emailSender;
            _logger = logger;
        }




        public async Task<ReservationDetailDto?> GetReservationByIdAsync(Guid reservationId)
        {
            // Owned baggage and price summary are loaded with the reservation.
            var reservation = await _context.Reservations
                .AsNoTracking()
                .Include(r => r.Passengers)
                .Include(r => r.DepartureFlight)
                .Include(r => r.ReturnFlight)
                .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

            if (reservation is null)
            {
                return null;
            }

            return new ReservationDetailDto
            {
                ReservationId = reservation.ReservationId,
                Pnr = reservation.Pnr,
                TripType = reservation.TripType,
                From = reservation.From,
                To = reservation.To,
                DepartureDate = reservation.DepartureDate,
                ReturnDate = reservation.ReturnDate,
                Cabin = reservation.Cabin,
                TotalPassengers = reservation.TotalPassengers,
                DepartureFlight = MapReservationFlight(reservation.DepartureFlight),
                ReturnFlight = reservation.ReturnFlight is null ? null : MapReservationFlight(reservation.ReturnFlight),
                Passengers = _mapper.Map<List<PassengerInfoDto>>(reservation.Passengers),
                BaggageSelection = new ReservationBaggageDto
                {
                    CabinBaggage = MapReservationBaggage(reservation.BaggageSelection.CabinBaggage),
                    CheckedBaggage = MapReservationBaggage(reservation.BaggageSelection.CheckedBaggage)
                },
                PriceSummary = new ReservationPriceSummaryDto
                {
                    DepartureFlightPrice = reservation.PriceSummary.DepartureFlightPrice,
                    ReturnFlightPrice = reservation.PriceSummary.ReturnFlightPrice,
                    CabinBaggagePrice = reservation.PriceSummary.CabinBaggagePrice,
                    CheckedBaggagePrice = reservation.PriceSummary.CheckedBaggagePrice,
                    TotalPrice = reservation.PriceSummary.TotalPrice
                }
            };
        }

        private static readonly string[] DemoOccupiedSeats = { "1A", "1F", "3C", "4D", "7B", "9E" };

        private async Task<Reservation?> FindTripAsync(string? pnr, string? surname)
        {
            if (string.IsNullOrWhiteSpace(pnr) || string.IsNullOrWhiteSpace(surname))
            {
                return null;
            }

            var normalizedPnr = pnr.Trim().ToUpperInvariant();
            var reservation = await _context.Reservations.AsNoTracking()
                .Include(r => r.Passengers).Include(r => r.DepartureFlight).Include(r => r.ReturnFlight)
                .FirstOrDefaultAsync(r => r.Pnr == normalizedPnr);
            if (reservation == null)
            {
                return null;
            }

            var comparer = StringComparer.Create(CultureInfo.GetCultureInfo("tr-TR"), true);
            foreach (var passenger in reservation.Passengers)
            {
                if (comparer.Equals(passenger.LastName.Trim(), surname.Trim()))
                {
                    return reservation;
                }
            }
            return null;
        }

        private async Task<TripDetailDto> MapTripAsync(Reservation reservation)
        {
            // Reuse the existing detail mapping, but never expose identity documents in the hero.
            var detail = (await GetReservationByIdAsync(reservation.ReservationId))!;
            var trip = new TripDetailDto
            {
                ReservationId = detail.ReservationId, Pnr = detail.Pnr, TripType = detail.TripType,
                From = detail.From, To = detail.To, DepartureDate = detail.DepartureDate,
                ReturnDate = detail.ReturnDate, Cabin = detail.Cabin, TotalPassengers = detail.TotalPassengers,
                DepartureFlight = detail.DepartureFlight, ReturnFlight = detail.ReturnFlight,
                BaggageSelection = detail.BaggageSelection, PriceSummary = detail.PriceSummary
            };
            foreach (var passenger in reservation.Passengers)
            {
                trip.Passengers.Add(new TripPassengerDto
                {
                    PassengerId = passenger.PassengerId, FirstName = passenger.FirstName,
                    LastName = passenger.LastName, PassengerType = passenger.PassengerType
                });
            }
            return trip;
        }

        public async Task<TripDetailDto?> GetTripAsync(TripLookupDto dto)
        {
            var reservation = await FindTripAsync(dto.Pnr, dto.Surname);
            return reservation == null ? null : await MapTripAsync(reservation);
        }

        public async Task<CheckInLookupDto?> GetCheckInAsync(TripLookupDto dto)
        {
            var reservation = await FindTripAsync(dto.Pnr, dto.Surname);
            if (reservation == null) return null;

            var result = new CheckInLookupDto { Trip = await MapTripAsync(reservation) };
            result.Flights.Add(await MapCheckInFlightAsync(reservation.DepartureFlight, reservation.DepartureDate));
            if (reservation.ReturnFlight != null && reservation.ReturnDate.HasValue)
            {
                result.Flights.Add(await MapCheckInFlightAsync(reservation.ReturnFlight, reservation.ReturnDate.Value));
            }

            var checkIns = await _context.DemoCheckIns.AsNoTracking()
                .Include(c => c.Passenger).Include(c => c.Flight)
                .Where(c => c.Passenger.ReservationId == reservation.ReservationId).ToListAsync();
            foreach (var checkIn in checkIns)
            {
                result.CheckIns.Add(MapBoardingPass(checkIn, reservation));
            }
            return result;
        }

        private async Task<CheckInFlightDto> MapCheckInFlightAsync(Flight flight, DateOnly date)
        {
            var occupied = new List<string>(DemoOccupiedSeats);
            occupied.AddRange(await _context.DemoCheckIns.AsNoTracking()
                .Where(c => c.FlightId == flight.FlightId).Select(c => c.SeatNumber).ToListAsync());
            return new CheckInFlightDto
            {
                FlightId = flight.FlightId, Date = date, Flight = MapReservationFlight(flight), OccupiedSeats = occupied
            };
        }

        public async Task<BoardingPassDto> CompleteCheckInAsync(CompleteCheckInDto dto)
        {
            var reservation = await FindTripAsync(dto.Pnr, dto.Surname);
            if (reservation == null) throw new KeyNotFoundException("PNR veya soyad ile eşleşen rezervasyon bulunamadı.");

            var passenger = reservation.Passengers.FirstOrDefault(p => p.PassengerId == dto.PassengerId);
            if (passenger == null) throw new ArgumentException("Seçilen yolcu bu rezervasyona ait değil.");

            Flight? flight = null;
            if (dto.FlightId == reservation.DepartureFlightId) flight = reservation.DepartureFlight;
            if (dto.FlightId == reservation.ReturnFlightId && reservation.ReturnDate.HasValue) flight = reservation.ReturnFlight;
            if (flight == null) throw new ArgumentException("Seçilen uçuş bu rezervasyona ait değil.");

            var seat = dto.SeatNumber?.Trim().ToUpperInvariant() ?? "";
            if (seat.Length < 2 || seat.Length > 3 || !"ABCDEF".Contains(seat[^1]) ||
                !int.TryParse(seat[..^1], out var row) || row < 1 || row > 30 || seat != $"{row}{seat[^1]}")
            {
                throw new ArgumentException("Lütfen geçerli bir koltuk seçin.");
            }
            if (await _context.DemoCheckIns.AnyAsync(c => c.PassengerId == passenger.PassengerId && c.FlightId == flight.FlightId))
            {
                throw new InvalidOperationException("Bu yolcu için bu uçuşta demo check-in daha önce tamamlanmış.");
            }
            if (DemoOccupiedSeats.Contains(seat) || await _context.DemoCheckIns.AnyAsync(c => c.FlightId == flight.FlightId && c.SeatNumber == seat))
            {
                throw new InvalidOperationException("Bu koltuk dolu. Lütfen başka bir koltuk seçin.");
            }

            var checkIn = new DemoCheckIn
            {
                PassengerId = passenger.PassengerId, FlightId = flight.FlightId,
                IsCheckedIn = true, CheckInDate = DateTime.UtcNow, SeatNumber = seat,
                BoardingPassNumber = Guid.NewGuid().ToString("N").ToUpperInvariant()
            };
            _context.DemoCheckIns.Add(checkIn);
            try
            {
                // Unique indexes also guard simultaneous requests for the same passenger or seat.
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException exception) when (exception.InnerException is SqlException sql && (sql.Number == 2601 || sql.Number == 2627))
            {
                throw new InvalidOperationException("Check-in veya koltuk başka bir işlemde kaydedildi. Lütfen yeniden sorgulayın.");
            }

            checkIn.Passenger = passenger;
            checkIn.Flight = flight;

            var boardingPass = MapBoardingPass(checkIn, reservation);

            // Check-in SQL'e kaydedildi, şimdi boarding bilgilerini mail atıyoruz.
            await SendCheckInEmailAsync(reservation.ContactEmail, boardingPass);

            return boardingPass;
        }

        private async Task SendReservationEmailAsync(Reservation reservation)
        {
            var tripTypeText = reservation.TripType == "roundTrip" ? "Gidiş-Dönüş" : "Tek Yön";

            var returnDateText = "";
            if (reservation.ReturnDate.HasValue)
            {
                returnDateText = $"Dönüş Tarihi: {reservation.ReturnDate.Value:dd.MM.yyyy}\n";
            }

            var passengerNames = string.Join(", ", reservation.Passengers.Select(p => p.FirstName + " " + p.LastName));

            var message = $"""
                Rezervasyonunuz başarıyla oluşturuldu.

                PNR: {reservation.Pnr}
                Nereden: {reservation.From}
                Nereye: {reservation.To}
                Uçuş Tipi: {tripTypeText}
                Gidiş Tarihi: {reservation.DepartureDate:dd.MM.yyyy}
                {returnDateText}Yolcular: {passengerNames}
                Toplam Tutar: {reservation.PriceSummary.TotalPrice:0.00} TL

                FlyToHappy ile iyi yolculuklar.
                """;

            try
            {
                await _emailSender.SendEmailAsync(reservation.ContactEmail, "FlyToHappy Rezervasyon Bilgileri", message);
                _logger.LogInformation("Rezervasyon maili gönderildi. PNR: {Pnr}", reservation.Pnr);
            }
            catch (Exception ex)
            {
                // Mail gitmese de rezervasyon kaydı geçerlidir; sadece logluyoruz.
                _logger.LogError(ex, "Rezervasyon maili gönderilemedi. PNR: {Pnr}", reservation.Pnr);
            }
        }

        private async Task SendCheckInEmailAsync(string contactEmail, BoardingPassDto boardingPass)
        {
            var message = $"""
                Check-in işleminiz başarıyla tamamlandı.

                PNR: {boardingPass.Pnr}
                Yolcu: {boardingPass.PassengerName}
                Uçuş: {boardingPass.Airline} {boardingPass.FlightNumber}
                Rota: {boardingPass.From} → {boardingPass.To}
                Tarih: {boardingPass.Date:dd.MM.yyyy} {boardingPass.DepartureTime}
                Koltuk: {boardingPass.SeatNumber}
                Boarding Pass No: {boardingPass.BoardingPassNumber}

                İyi yolculuklar.
                FlyToHappy
                """;

            try
            {
                await _emailSender.SendEmailAsync(contactEmail, "FlyToHappy Check-in Bilgileri", message);
                _logger.LogInformation("Check-in maili gönderildi. PNR: {Pnr}", boardingPass.Pnr);
            }
            catch (Exception ex)
            {
                // Mail gitmese de check-in kaydı geçerlidir; sadece logluyoruz.
                _logger.LogError(ex, "Check-in maili gönderilemedi. PNR: {Pnr}", boardingPass.Pnr);
            }
        }

        private static BoardingPassDto MapBoardingPass(DemoCheckIn checkIn, Reservation reservation)
        {
            return new BoardingPassDto
            {
                PassengerId = checkIn.PassengerId, FlightId = checkIn.FlightId,
                PassengerName = $"{checkIn.Passenger.FirstName} {checkIn.Passenger.LastName}",
                Pnr = reservation.Pnr, Airline = checkIn.Flight.Airline, FlightNumber = checkIn.Flight.FlightNumber,
                From = checkIn.Flight.DepartureAirport, To = checkIn.Flight.ArrivalAirport,
                FromAirportName = checkIn.Flight.DepartureAirportName, ToAirportName = checkIn.Flight.ArrivalAirportName,
                Date = checkIn.FlightId == reservation.DepartureFlightId ? reservation.DepartureDate : reservation.ReturnDate!.Value,
                DepartureTime = checkIn.Flight.DepartureTime, Cabin = reservation.Cabin,
                SeatNumber = checkIn.SeatNumber, BoardingPassNumber = checkIn.BoardingPassNumber, CheckInDate = checkIn.CheckInDate
            };
        }

        public async Task<FlightStatusDto?> GetFlightStatusAsync(string flightNumber, DateOnly date)
        {
            var number = flightNumber.Trim().Replace(" ", "").ToUpperInvariant();
            // Snapshots have no live status. Reservation dates identify the scheduled flight day.
            // Contains: a 1-stop snapshot stores "TK2023 / TK2816", so searching "TK2023" alone must also find it.
            var departure = await _context.Reservations.AsNoTracking()
                .Where(r => r.DepartureDate == date && r.DepartureFlight.FlightNumber.Replace(" ", "").ToUpper().Contains(number))
                .Select(r => r.DepartureFlight).FirstOrDefaultAsync();
            var flight = departure;
            if (flight == null)
            {
                flight = await _context.Reservations.AsNoTracking()
                    .Where(r => r.ReturnDate == date && r.ReturnFlight != null && r.ReturnFlight.FlightNumber.Replace(" ", "").ToUpper().Contains(number))
                    .Select(r => r.ReturnFlight).FirstOrDefaultAsync();
            }
            if (flight == null) return null;

            return new FlightStatusDto
            {
                FlightNumber = flight.FlightNumber, Airline = flight.Airline,
                From = flight.DepartureAirport, To = flight.ArrivalAirport, Date = date,
                FromAirportName = flight.DepartureAirportName, ToAirportName = flight.ArrivalAirportName,
                DepartureTime = flight.DepartureTime, ArrivalTime = flight.ArrivalTime,
                Segments = ReadSegments(flight.SegmentsJson)
            };
        }

        private static ReservationFlightDto MapReservationFlight(Flight flight)
        {
            return new ReservationFlightDto
            {
                Airline = flight.Airline,
                AirlineCode = flight.AirlineCode,
                FlightNumber = flight.FlightNumber,
                DepartureAirport = flight.DepartureAirport,
                ArrivalAirport = flight.ArrivalAirport,
                DepartureAirportName = flight.DepartureAirportName,
                ArrivalAirportName = flight.ArrivalAirportName,
                DepartureTime = flight.DepartureTime,
                ArrivalTime = flight.ArrivalTime,
                Duration = flight.Duration,
                Stops = flight.Stops,
                Segments = ReadSegments(flight.SegmentsJson)
            };
        }

        // Segments are stored as JSON text in the Flight snapshot. Older rows have no value -> empty list.
        private static List<FlightSegmentDto> ReadSegments(string segmentsJson)
        {
            if (string.IsNullOrWhiteSpace(segmentsJson))
            {
                return new List<FlightSegmentDto>();
            }

            return JsonSerializer.Deserialize<List<FlightSegmentDto>>(segmentsJson) ?? new List<FlightSegmentDto>();
        }

        private static ReservationBaggageOptionDto MapReservationBaggage(BaggageOption baggage)
        {
            return new ReservationBaggageOptionDto
            {
                Name = baggage.Name,
                Kg = baggage.Kg,
                Price = baggage.Price
            };
        }

        public async Task<ReservationCreatedDto> CreateReservationAsync(CreateReservationDto dto)
        {
            ArgumentNullException.ThrowIfNull(dto.BaggageSelection);

            // ================================
            // Baggage 
            // ================================
            var cabinBaggage = CreateCabinBaggage(dto.BaggageSelection.CabinBaggageType);
            var checkedBaggage = CreateCheckedBaggage(dto.BaggageSelection.CheckedBaggageKg);
            var baggageSelection = new BaggageSelection
            {
                CabinBaggage = cabinBaggage,
                CheckedBaggage = checkedBaggage,
                TotalBaggagePrice = cabinBaggage.Price + checkedBaggage.Price
            };


            var cabinBaggagePrice = baggageSelection.CabinBaggage.Price;

            var checkedBaggagePrice = baggageSelection.CheckedBaggage.Price;

            var baggagePrice = baggageSelection.TotalBaggagePrice;






            // ================================
            // Departure & Return Flight
            // The chosen flights live in the backend search cache (not in SQL yet).
            // Only the flights actually reserved are written to SQL, as new Flight rows.
            // ================================
            var departureSearchFlight = _rapidApiFlightService.GetCachedSearchFlight(dto.DepartureSearchFlightId);

            if (departureSearchFlight == null)
            {
                throw new ArgumentException("Gidiş uçuşu bulunamadı veya arama süresi doldu. Lütfen uçuş aramasını tekrarlayın.");
            }

            var departureFlight = CreateFlightSnapshot(departureSearchFlight);


            Flight? returnFlight = null;

            if (dto.ReturnSearchFlightId.HasValue)
            {
                var returnSearchFlight = _rapidApiFlightService.GetCachedSearchFlight(dto.ReturnSearchFlightId.Value);

                if (returnSearchFlight == null)
                {
                    throw new ArgumentException("Dönüş uçuşu bulunamadı veya arama süresi doldu. Lütfen uçuş aramasını tekrarlayın.");
                }

                returnFlight = CreateFlightSnapshot(returnSearchFlight);
            }


            // ================================
            // Passenger Count
            // ================================
            var adults = dto.Passengers.Count(p =>
                p.PassengerType.Equals("Yetişkin", StringComparison.OrdinalIgnoreCase));

            var children = dto.Passengers.Count(p =>
                p.PassengerType.Equals("Çocuk", StringComparison.OrdinalIgnoreCase));

            var infants = dto.Passengers.Count(p =>
                p.PassengerType.Equals("Bebek", StringComparison.OrdinalIgnoreCase));

            var totalPassengers = dto.Passengers.Count;

            var chargeablePassengers = adults + children;




            // ================================
            // BasePrice is the database fare per chargeable passenger.
            // ================================
            var departureFlightPrice = departureFlight.BasePrice * chargeablePassengers;
            var returnFlightPrice = 0m;

            
            if (dto.TripType == "roundTrip")
            {
                if (returnFlight == null)
                {
                    throw new ArgumentException("Gidiş-dönüş için dönüş uçuşu gereklidir.", nameof(dto.ReturnSearchFlightId));
                }

                returnFlightPrice = returnFlight.BasePrice * chargeablePassengers;
            }

            var priceSummary = new BookingPriceSummary
            {
                DepartureFlightPrice = departureFlightPrice,
                ReturnFlightPrice = returnFlightPrice,
                CabinBaggagePrice = cabinBaggagePrice,
                CheckedBaggagePrice = checkedBaggagePrice,
                BaggagePrice = baggagePrice,
                TotalPrice = departureFlightPrice + returnFlightPrice + baggagePrice
            };



            // ================================
            // fulled and Match Passenger Entity 
            // ================================
            var passengers = _mapper.Map<List<Passenger>>(dto.Passengers);


            // ================================
            // Creatte PNR NUMBER
            // ================================
            var pnr = await GenerateUniquePnrAsync();


            // ================================
            // Fulled Reservation Entity
            // ================================
            var reservation = new Reservation
            {
                Pnr = pnr,

                TripType = dto.TripType,
                From = dto.From,
                To = dto.To,
                DepartureDate = dto.DepartureDate,
                ReturnDate = dto.ReturnDate,
                Cabin = dto.Cabin,

                Adults = adults,
                Children = children,
                Infants = infants,
                TotalPassengers = totalPassengers,
                ChargeablePassengers = chargeablePassengers,

                ContactFirstName = dto.ContactFirstName,
                ContactLastName = dto.ContactLastName,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone,

                // EF inserts the new Flight rows first and fills the FK ids.
                DepartureFlight = departureFlight,
                ReturnFlight = returnFlight,

                Passengers = passengers,

                BaggageSelection = baggageSelection,
                PriceSummary = priceSummary
            };



            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            // Rezervasyon SQL'e kaydedildi, şimdi bilgi mailini gönderiyoruz.
            await SendReservationEmailAsync(reservation);

            return new ReservationCreatedDto
            {
                ReservationId = reservation.ReservationId,
                Pnr = reservation.Pnr

            };



        }






        // ================================
        // Flight snapshot: copy the search result into a Flight row for this reservation.
        // BasePrice = provider fare for one passenger (authoritative). Price mirrors it.
        // ================================
        private static Flight CreateFlightSnapshot(SearchFlightDto searchFlight)
        {
            return new Flight
            {
                Airline = searchFlight.Airline,
                AirlineCode = searchFlight.AirlineCode,
                FlightNumber = searchFlight.FlightNumber,
                DepartureAirport = searchFlight.DepartureAirport,
                ArrivalAirport = searchFlight.ArrivalAirport,
                DepartureAirportName = searchFlight.DepartureAirportName,
                ArrivalAirportName = searchFlight.ArrivalAirportName,
                SegmentsJson = JsonSerializer.Serialize(searchFlight.Segments),
                DepartureTime = searchFlight.DepartureTime,
                ArrivalTime = searchFlight.ArrivalTime,
                Duration = searchFlight.Duration,
                Stops = searchFlight.Stops,
                BaggageKg = searchFlight.BaggageKg,
                CabinBaggageIncluded = searchFlight.CabinBaggageIncluded,
                CheckedBaggageIncluded = searchFlight.CheckedBaggageIncluded,
                CabinClass = searchFlight.CabinClass,
                BasePrice = searchFlight.Price,
                Price = searchFlight.Price
            };
        }


        // ================================
        // generate Baggage Options
        // ================================
        private static BaggageOption CreateCabinBaggage(string cabinBaggageType)
        {
            return cabinBaggageType switch
            {
                "personal" => new BaggageOption 
                { 
                    Type = "personal", 
                    Name = "Kişisel Eşya", 
                    Kg = 0, Price = 0m 
                },
                
                "cabin-s" => new BaggageOption
                { 
                    Type = "cabin-s", 
                    Name = "Kabin Valizi S",
                    Kg = 8, Price = 350m 
                },
                "cabin-l" => new BaggageOption
                { 
                    Type = "cabin-l",
                    Name = "Kabin Valizi L",
                    Kg = 12, Price = 550m 
                },
                
                _ => throw new ArgumentException("Geçersiz kabin bagajı seçimi.", nameof(cabinBaggageType))
            };
        }

        private static BaggageOption CreateCheckedBaggage(int checkedBaggageKg)
        {
            return checkedBaggageKg switch
            {
                0 => new BaggageOption 
                { 
                    Name = "Ek bagaj yok",
                    Kg = 0, Price = 0m 
                },
                12 => new BaggageOption 
                { 
                    Name = "+12 kg Ek Bagaj",
                    Kg = 12, Price = 1056m 
                },
                20 => new BaggageOption 
                { 
                    Name = "+20 kg Ek Bagaj",
                    Kg = 20, Price = 1677.50m 
                },
                30 => new BaggageOption 
                { 
                    Name = "+30 kg Ek Bagaj",
                    Kg = 30, Price = 4161.30m 
                },
                50 => new BaggageOption
                { 
                    Name = "+50 kg Ek Bagaj",
                    Kg = 50, Price = 9128.90m 
                },

                _ => throw new ArgumentOutOfRangeException(nameof(checkedBaggageKg), "Geçersiz uçak altı bagaj seçimi.")
            };
        }


        // ================================
        // generate PNR Number
        // ================================
        private async Task<string> GenerateUniquePnrAsync()
        {
            const string characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

            string pnr;

            do
            {
                pnr = new string(
                    Enumerable.Range(0, 6)
                        .Select(_ => characters[Random.Shared.Next(characters.Length)])
                        .ToArray()
                );
            }
            while (await _context.Reservations.AnyAsync(r => r.Pnr == pnr));

            return pnr;
        }


    }
}
