using Smart.SolarMicrogridTradingSystem.Api.Models.Common;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IApiResponseFactory
    {
        ApiResponse Success(string message, object? data = null);
        ApiResponse Error(string message);
    }
}
