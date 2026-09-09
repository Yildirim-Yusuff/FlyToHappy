using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.SearchComponents
{
    public class _FooterSearchDefaultComponentPartial :ViewComponent
    {

        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
