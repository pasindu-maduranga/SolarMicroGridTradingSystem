using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
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
        [RequirePermission("USER_MGT", "READ")]
        public async Task<ApiResponse> Get()
        {
            return await userService.GetAllUsersAsync();
        }

        [HttpGet]
        [Route("{id}")]
        [RequirePermission("USER_MGT", "READ")]
        public async Task<ApiResponse> GetById(string id)
        {
            return await userService.GetUserByIdAsync(id);
        }

        [HttpPost]
        [RequirePermission("USER_MGT", "WRITE")]
        public async Task<ApiResponse> Post([FromBody] CreateUserRequest request)
        {
            return await userService.CreateUserAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        [RequirePermission("USER_MGT", "WRITE")]
        public async Task<ApiResponse> Put(string id, [FromBody] UpdateUserRequest request)
        {
            return await userService.UpdateUserAsync(id, request);
        }

        [HttpPost]
        [Route("{id}/reset-password")]
        [RequirePermission("USER_MGT", "WRITE")]
        public async Task<ApiResponse> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
        {
            return await userService.ResetPasswordAsync(id, request);
        }

        [HttpPost]
        [Route("change-password")]
        public async Task<ApiResponse> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            return await userService.ChangePasswordAsync(request);
        }

        [HttpDelete]
        [Route("{id}")]
        [RequirePermission("USER_MGT", "DELETE")]
        public async Task<ApiResponse> Delete(string id)
        {
            return await userService.DeleteUserAsync(id);
        }
    }
}

