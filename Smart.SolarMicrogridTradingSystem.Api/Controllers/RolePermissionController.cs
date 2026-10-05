/*
 * File: RolePermissionController.cs
 * Description: Contains the implementation for RolePermissionController.
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
    public class RolePermissionController : ControllerBase
    {
        private readonly IRolePermissionService rolePermissionService;

        public RolePermissionController(IRolePermissionService rolePermissionService)
        {
            this.rolePermissionService = rolePermissionService;
        }

        [HttpGet]
        [Route("GetPermissionByRoleId")]
        // Executes the GetPermissionByRoleId functionality.
        public async Task<ApiResponse> GetPermissionByRoleId([FromQuery] string loggedRoleID, [FromQuery] string assigningRoleID)
        {
            return await rolePermissionService.GetPermissionByRoleIdAsync(loggedRoleID, assigningRoleID);
        }

        [HttpPost]
        [Route("SaveRolePermission")]
        // Executes the SaveRolePermission functionality.
        public async Task<ApiResponse> SaveRolePermission([FromBody] SaveRolePermissionRequest request)
        {
            return await rolePermissionService.SaveRolePermissionAsync(request);
        }
    }
}
