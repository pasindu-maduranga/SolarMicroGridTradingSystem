/*
 * File: MainNavMenuController.cs
 * Description: Contains the implementation for MainNavMenuController.
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
    public class MainNavMenuController : ControllerBase
    {
        private readonly IMainNavMenuService mainNavMenuService;

        public MainNavMenuController(IMainNavMenuService mainNavMenuService)
        {
            this.mainNavMenuService = mainNavMenuService;
        }

        [HttpGet]
        [Route("GetMenuModelsByRole")]
        // Executes the GetMenuModelsByRole functionality.
        public async Task<ApiResponse> GetMenuModelsByRole([FromQuery] string roleID, [FromQuery] string mainMenuID)
        {
            return await mainNavMenuService.GetMenuModelsByRoleAsync(roleID, mainMenuID);
        }
    }
}
