using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.SearchComponents
{
    public class _ScriptSearchDefaultComponentPartial: ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
