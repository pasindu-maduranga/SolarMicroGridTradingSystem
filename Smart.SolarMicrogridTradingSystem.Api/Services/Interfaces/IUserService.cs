/*
 * File: IUserService.cs
 * Description: Contains the implementation for IUserService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetByUsernameAsync(string username);
        Task CreateAsync(User user);
        Task<ApiResponse> GetAllUsersAsync();
        Task<ApiResponse> GetUserByIdAsync(string id);
        Task<ApiResponse> CreateUserAsync(CreateUserRequest request);
        Task<ApiResponse> UpdateUserAsync(string id, UpdateUserRequest request);
        Task<ApiResponse> ResetPasswordAsync(string id, ResetPasswordRequest request);
        Task<ApiResponse> ChangePasswordAsync(ChangePasswordRequest request);
        Task<ApiResponse> DeleteUserAsync(string id);
    }
}
