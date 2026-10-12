/*
 * File: ParentMainMenuController.cs
 * Description: Contains the implementation for ParentMainMenuController.
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
    public class ParentMainMenuController : ControllerBase
    {
        private readonly IMenuService menuService;

        public ParentMainMenuController(IMenuService menuService)
        {
            this.menuService = menuService;
        }

        [HttpGet]
        [Route("GetParentMenuByRole")]
        // Executes the GetParentMenuByRole functionality.
        public async Task<ApiResponse> GetParentMenuByRole([FromQuery] string roleID)
        {
            return await menuService.GetParentMenuByRoleAsync(roleID);
        }

        [HttpGet]
        [Route("GetAllParentMenuDetails")]
        // Executes the GetAllParentMenuDetails functionality.
        public async Task<ApiResponse> GetAllParentMenuDetails()
        {
            return await menuService.GetAllParentMenuDetailsAsync();
        }

        [HttpPost]
        [Route("SaveParentMenuDetails")]
        // Executes the SaveParentMenuDetails functionality.
        public async Task<ApiResponse> SaveParentMenuDetails([FromBody] ParentMenuRequest request)
        {
            return await menuService.SaveParentMenuDetailsAsync(request);
        }

        [HttpPut]
        [Route("UpdateParentMenuDetails/{id}")]
        // Executes the UpdateParentMenuDetails functionality.
        public async Task<ApiResponse> UpdateParentMenuDetails(string id, [FromBody] ParentMenuRequest request)
        {
            return await menuService.UpdateParentMenuDetailsAsync(id, request);
        }

        [HttpDelete]
        [Route("{id}")]
        // Executes the Delete functionality.
        public async Task<ApiResponse> Delete(string id)
        {
            return await menuService.DeleteMenuNodeAsync(id);
        }
    }
}
