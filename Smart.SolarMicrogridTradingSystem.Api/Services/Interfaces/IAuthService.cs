/*
 * File: IAuthService.cs
 * Description: Contains the implementation for IAuthService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse> LoginAsync(LoginDto login);
    }
}
