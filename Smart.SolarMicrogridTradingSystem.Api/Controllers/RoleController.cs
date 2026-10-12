/*
 * File: RoleController.cs
 * Description: Contains the implementation for RoleController.
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
    public class RoleController : ControllerBase
    {
        private readonly IRoleService roleService;

        public RoleController(IRoleService roleService)
        {
            this.roleService = roleService;
        }

        [HttpGet]
        // Executes the Get functionality.
        public async Task<ApiResponse> Get()
        {
            return await roleService.GetAllRolesAsync();
        }

        [HttpGet]
        [Route("{id}")]
        // Executes the GetById functionality.
        public async Task<ApiResponse> GetById(string id)
        {
            return await roleService.GetRoleByIdAsync(id);
        }

        [HttpPost]
        // Executes the Post functionality.
        public async Task<ApiResponse> Post([FromBody] RoleRequest request)
        {
            return await roleService.CreateRoleAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        // Executes the Put functionality.
        public async Task<ApiResponse> Put(string id, [FromBody] RoleRequest request)
        {
            return await roleService.UpdateRoleAsync(id, request);
        }

        [HttpDelete]
        [Route("{id}")]
        // Executes the Delete functionality.
        public async Task<ApiResponse> Delete(string id)
        {
            return await roleService.DeleteRoleAsync(id);
        }
    }
}
