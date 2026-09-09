using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.Controllers
{
    public class FlightsController : Controller
    {
        public IActionResult SearchResults()
        {
            return View();
        }

        public IActionResult PassengerInfo()
        {
            return View();
        }

        public IActionResult Baggage()
        {
            return View();
        }

        public IActionResult Confirmation()
        {
            return View();
        }

        public IActionResult Payment()
        {
            return View();
        }

        public IActionResult ReservationSuccess()
        {
            return View();
        }
    }

}
