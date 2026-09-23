using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService roleService;

        public RoleController(IRoleService roleService)
        {
            this.roleService = roleService;
        }

        [HttpGet]
        [RequirePermission("ROLE_MGT", "READ")]
        public async Task<ApiResponse> Get()
        {
            return await roleService.GetAllRolesAsync();
        }

        [HttpGet]
        [Route("{id}")]
        [RequirePermission("ROLE_MGT", "READ")]
        public async Task<ApiResponse> GetById(string id)
        {
            return await roleService.GetRoleByIdAsync(id);
        }

        [HttpPost]
        [RequirePermission("ROLE_MGT", "WRITE")]
        public async Task<ApiResponse> Post([FromBody] RoleRequest request)
        {
            return await roleService.CreateRoleAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        [RequirePermission("ROLE_MGT", "WRITE")]
        public async Task<ApiResponse> Put(string id, [FromBody] RoleRequest request)
        {
            return await roleService.UpdateRoleAsync(id, request);
        }

        [HttpDelete]
        [Route("{id}")]
        [RequirePermission("ROLE_MGT", "DELETE")]
        public async Task<ApiResponse> Delete(string id)
        {
            return await roleService.DeleteRoleAsync(id);
        }
    }
}

