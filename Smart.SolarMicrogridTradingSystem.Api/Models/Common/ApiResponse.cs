namespace Smart.SolarMicrogridTradingSystem.Api.Models.Common
{
    public class ApiResponse
    {
        public string StatusCode { get; set; } = null!;
        public string Message { get; set; } = null!;
        public object? Data { get; set; }
    }
}
