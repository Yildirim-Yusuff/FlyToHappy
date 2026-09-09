using FlyToHappy.Data;
using FlyToHappy.Dtos.Reservations;
using FlyToHappy.Models;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace FlyToHappy.Services.ReservationServices
{
    public class ReservationService : IReservationService
    {

        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public ReservationService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

        private static ReservationFlightDto MapReservationFlight(Flight flight)
        {
            return new ReservationFlightDto
            {
                Airline = flight.Airline,
                AirlineCode = flight.AirlineCode,
                FlightNumber = flight.FlightNumber,
                DepartureAirport = flight.DepartureAirport,
                ArrivalAirport = flight.ArrivalAirport,
                DepartureTime = flight.DepartureTime,
                ArrivalTime = flight.ArrivalTime,
                Duration = flight.Duration,
                Stops = flight.Stops
            };
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
            // Departure  & Return Flight
            // ================================
            var departureFlight = await _context.Flights
                .FirstOrDefaultAsync(f => f.FlightId == dto.DepartureFlightId);

            if (departureFlight == null)
            {
                throw new Exception("Gidiş uçuşu bulunamadı.");
            }


            Flight? returnFlight = null;

            if (dto.ReturnFlightId.HasValue)
            {
                returnFlight = await _context.Flights
                    .FirstOrDefaultAsync(f => f.FlightId == dto.ReturnFlightId.Value);

                if (returnFlight is null)
                {
                    throw new KeyNotFoundException("Dönüş uçuşu bulunamadı.");
                }


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
                    throw new ArgumentException("Gidiş-dönüş için dönüş uçuşu gereklidir.", nameof(dto.ReturnFlightId));
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

                DepartureFlightId = dto.DepartureFlightId,
                DepartureFlight = departureFlight,

                ReturnFlightId = dto.ReturnFlightId,
                ReturnFlight = returnFlight,

                Passengers = passengers,

                BaggageSelection = baggageSelection,
                PriceSummary = priceSummary
            };



            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();


            return new ReservationCreatedDto
            {
                ReservationId = reservation.ReservationId,
                Pnr = reservation.Pnr

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
