/*
 * File: PermissionController.cs
 * Description: Contains the implementation for PermissionController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService permissionService;

        public PermissionController(IPermissionService permissionService)
        {
            this.permissionService = permissionService;
        }

        [HttpGet]
        [Route("GetPermissionsByRoleAndScreen")]
        // Executes the GetPermissionsByRoleAndScreen functionality.
        public async Task<ApiResponse> GetPermissionsByRoleAndScreen([FromQuery] string roleID, [FromQuery] string screenCode)
        {
            return await permissionService.GetPermissionsByRoleAndScreenAsync(roleID, screenCode);
        }
    }
}
