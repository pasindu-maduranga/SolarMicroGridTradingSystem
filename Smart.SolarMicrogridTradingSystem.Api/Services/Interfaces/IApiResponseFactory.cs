/*
 * File: IApiResponseFactory.cs
 * Description: Contains the implementation for IApiResponseFactory.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IApiResponseFactory
    {
        ApiResponse Success(string message, object? data = null);
        ApiResponse Error(string message);
    }
}
