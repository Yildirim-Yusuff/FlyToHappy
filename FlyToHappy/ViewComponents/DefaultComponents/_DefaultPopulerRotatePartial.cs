using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _DefaultPopulerRotatePartial : ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
