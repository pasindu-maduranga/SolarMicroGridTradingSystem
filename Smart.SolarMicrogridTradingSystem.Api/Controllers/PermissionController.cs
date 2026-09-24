using Microsoft.AspNetCore.Authorization;
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
        public async Task<ApiResponse> GetPermissionsByRoleAndScreen([FromQuery] string roleID, [FromQuery] string screenCode)
        {
            return await permissionService.GetPermissionsByRoleAndScreenAsync(roleID, screenCode);
        }
    }
}

