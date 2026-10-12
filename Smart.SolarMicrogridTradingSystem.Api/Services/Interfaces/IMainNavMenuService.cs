/*
 * File: IMainNavMenuService.cs
 * Description: Contains the implementation for IMainNavMenuService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IMainNavMenuService
    {
        Task<ApiResponse> GetMenuModelsByRoleAsync(string roleId, string mainMenuId);
    }
}
