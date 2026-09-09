using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _NavbarDefaultComponentPartial : ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();  
        }
    }
}
