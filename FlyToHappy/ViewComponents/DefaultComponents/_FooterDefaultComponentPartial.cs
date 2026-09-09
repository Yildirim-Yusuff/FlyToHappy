using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _FooterDefaultComponentPartial :ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
