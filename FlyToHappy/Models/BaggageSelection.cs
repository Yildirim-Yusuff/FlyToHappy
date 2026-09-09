namespace FlyToHappy.Models
{
    public class BaggageSelection
    {
        public BaggageOption CabinBaggage { get; set; } = new();

        public BaggageOption CheckedBaggage { get; set; } = new();

        public decimal TotalBaggagePrice { get; set; }
    }
}
