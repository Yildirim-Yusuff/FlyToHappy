namespace FlyToHappy.Models
{
    public class BaggageOption
    {
        public string? Type { get; set; }

        public string Name { get; set; } = string.Empty;

        public int Kg { get; set; }

        public decimal Price { get; set; }
    }
}
