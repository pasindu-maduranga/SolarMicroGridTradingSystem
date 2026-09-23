using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<ApiResponse> LoginAsync(LoginDto login);
        Task<User?> GetCurrentUserAsync(ClaimsPrincipal principal);
    }
}
