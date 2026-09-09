using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _HeaderDefaultComponentPartial: ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();  
        }

    }
}
