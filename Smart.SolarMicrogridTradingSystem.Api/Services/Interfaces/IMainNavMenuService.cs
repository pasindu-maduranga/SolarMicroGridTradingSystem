using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IMainNavMenuService
    {
        Task<ApiResponse> GetMenuModelsByRoleAsync(string roleId, string mainMenuId);
    }
}
