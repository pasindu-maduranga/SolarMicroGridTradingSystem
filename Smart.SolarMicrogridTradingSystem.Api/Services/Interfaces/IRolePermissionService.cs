using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IRolePermissionService
    {
        Task<List<RolePermission>> GetByRoleIdAsync(string roleId);
        Task SaveRolePermissionsAsync(string roleId, List<RolePermission> permissions);
        Task<ApiResponse> GetPermissionByRoleIdAsync(string loggedRoleId, string assigningRoleId);
        Task<ApiResponse> SaveRolePermissionAsync(SaveRolePermissionRequest request);
    }
}
