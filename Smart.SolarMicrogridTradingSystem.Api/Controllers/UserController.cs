/*
 * File: UserController.cs
 * Description: Contains the implementation for UserController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService userService;

        public UserController(IUserService userService)
        {
            this.userService = userService;
        }

        [HttpGet]
        // Executes the Get functionality.
        public async Task<ApiResponse> Get()
        {
            return await userService.GetAllUsersAsync();
        }

        [HttpGet]
        [Route("{id}")]
        // Executes the GetById functionality.
        public async Task<ApiResponse> GetById(string id)
        {
            return await userService.GetUserByIdAsync(id);
        }

        [HttpPost]
        // Executes the Post functionality.
        public async Task<ApiResponse> Post([FromBody] CreateUserRequest request)
        {
            return await userService.CreateUserAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        // Executes the Put functionality.
        public async Task<ApiResponse> Put(string id, [FromBody] UpdateUserRequest request)
        {
            return await userService.UpdateUserAsync(id, request);
        }

        [HttpPost]
        [Route("{id}/reset-password")]
        // Executes the ResetPassword functionality.
        public async Task<ApiResponse> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
        {
            return await userService.ResetPasswordAsync(id, request);
        }

        [HttpPost]
        [Route("change-password")]
        // Executes the ChangePassword functionality.
        public async Task<ApiResponse> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            return await userService.ChangePasswordAsync(request);
        }

        [HttpDelete]
        [Route("{id}")]
        // Executes the Delete functionality.
        public async Task<ApiResponse> Delete(string id)
        {
            return await userService.DeleteUserAsync(id);
        }
    }
}
