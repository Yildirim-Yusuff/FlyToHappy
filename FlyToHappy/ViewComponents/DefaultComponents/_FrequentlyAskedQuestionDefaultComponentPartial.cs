using Microsoft.AspNetCore.Mvc;

namespace FlyToHappy.ViewComponents.DefaultComponents
{
    public class _FrequentlyAskedQuestionDefaultComponentPartial : ViewComponent
    {
        public IViewComponentResult Invoke()
        {
            return View();
        }
    }
}
