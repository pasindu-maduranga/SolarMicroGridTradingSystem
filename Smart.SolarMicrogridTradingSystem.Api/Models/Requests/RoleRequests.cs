namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class RoleRequest
    {
        public string RoleName { get; set; } = null!;
        public int Level { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
    }
}
