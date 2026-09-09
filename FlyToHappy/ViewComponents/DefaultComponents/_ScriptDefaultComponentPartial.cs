using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _ScriptDefaultComponentPartial : ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
