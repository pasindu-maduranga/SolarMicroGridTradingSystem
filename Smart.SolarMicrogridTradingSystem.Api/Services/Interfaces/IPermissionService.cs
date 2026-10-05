/*
 * File: IPermissionService.cs
 * Description: Contains the implementation for IPermissionService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IPermissionService
    {
        Task<ApiResponse> GetPermissionsByRoleAndScreenAsync(string roleId, string screenCode);
    }
}
