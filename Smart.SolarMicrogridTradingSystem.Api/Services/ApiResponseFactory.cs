using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ApiResponseFactory : IApiResponseFactory
    {
        public ApiResponse Success(string message, object? data = null) => new ApiResponse
        {
            StatusCode = "Success",
            Message = message,
            Data = data
        };

        public ApiResponse Error(string message) => new ApiResponse
        {
            StatusCode = "Error",
            Message = message
        };
    }
}
