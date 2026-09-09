using AutoMapper;
using FlyToHappy.Dtos.Reservations;
using FlyToHappy.Models;

namespace FlyToHappy.Mapping
{
    public class GeneralMapping : Profile
    {
         
        
        public GeneralMapping()
        {
            CreateMap<PassengerInfoDto, Passenger>().ReverseMap();

        }





    }



}