/*
 * File: ApiResponseFactory.cs
 * Description: Contains the implementation for ApiResponseFactory.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ApiResponseFactory : IApiResponseFactory
    {
        // Executes the Success functionality.
        public ApiResponse Success(string message, object? data = null) => new ApiResponse
        {
            StatusCode = "Success",
            Message = message,
            Data = data
        };

        // Executes the Error functionality.
        public ApiResponse Error(string message) => new ApiResponse
        {
            StatusCode = "Error",
            Message = message
        };
    }
}
