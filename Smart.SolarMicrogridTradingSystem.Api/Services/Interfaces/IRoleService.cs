using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IRoleService
    {
        Task<List<Role>> GetAllAsync();
        Task<Role?> GetByIdAsync(string id);
        Task CreateAsync(Role role);
        Task<ApiResponse> GetAllRolesAsync();
        Task<ApiResponse> GetRoleByIdAsync(string id);
        Task<ApiResponse> CreateRoleAsync(RoleRequest request);
        Task<ApiResponse> UpdateRoleAsync(string id, RoleRequest request);
        Task<ApiResponse> DeleteRoleAsync(string id);
    }
}
