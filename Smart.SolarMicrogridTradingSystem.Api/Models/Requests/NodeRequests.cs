namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class NodeRequest
    {
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Capacity { get; set; }
        public int NumberOfSlots { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class AssignGridOperatorRequest
    {
        public string? AssignedGridOperatorUserId { get; set; }
    }
}
