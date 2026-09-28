using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IMenuService
    {
        Task<List<Menu>> GetAllAsync();
        Task CreateAsync(Menu menu);
        Task<ApiResponse> GetParentMenuByRoleAsync(string roleId);
        Task<ApiResponse> GetAllParentMenuDetailsAsync();
        Task<ApiResponse> SaveParentMenuDetailsAsync(ParentMenuRequest request);
        Task<ApiResponse> UpdateParentMenuDetailsAsync(string id, ParentMenuRequest request);
        Task<ApiResponse> GetAllMenuDetailsAsync();
        Task<ApiResponse> SaveMenuDetailsAsync(MenuRequest request);
        Task<ApiResponse> UpdateMenuDetailsAsync(string id, MenuRequest request);
        Task<ApiResponse> GetAllScreenDetailsAsync();
        Task<ApiResponse> SaveScreenDetailsAsync(List<ScreenRequest> requests);
        Task<ApiResponse> UpdateScreenDetailsAsync(string id, ScreenRequest request);
        Task<ApiResponse> DeleteMenuNodeAsync(string id);
    }
}
