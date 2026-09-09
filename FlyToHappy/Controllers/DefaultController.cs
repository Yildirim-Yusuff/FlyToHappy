using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.Controllers
{
    public class DefaultController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
