/*
 * File: MenuController.cs
 * Description: Contains the implementation for MenuController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService menuService;

        public MenuController(IMenuService menuService)
        {
            this.menuService = menuService;
        }

        [HttpGet]
        [Route("GetAllMenuDetails")]
        // Executes the GetAllMenuDetails functionality.
        public async Task<ApiResponse> GetAllMenuDetails()
        {
            return await menuService.GetAllMenuDetailsAsync();
        }

        [HttpPost]
        [Route("SaveMenuDetails")]
        // Executes the SaveMenuDetails functionality.
        public async Task<ApiResponse> SaveMenuDetails([FromBody] MenuRequest request)
        {
            return await menuService.SaveMenuDetailsAsync(request);
        }

        [HttpPut]
        [Route("UpdateMenuDetails/{id}")]
        // Executes the UpdateMenuDetails functionality.
        public async Task<ApiResponse> UpdateMenuDetails(string id, [FromBody] MenuRequest request)
        {
            return await menuService.UpdateMenuDetailsAsync(id, request);
        }

        [HttpGet]
        [Route("GetAllScreenDetails")]
        // Executes the GetAllScreenDetails functionality.
        public async Task<ApiResponse> GetAllScreenDetails()
        {
            return await menuService.GetAllScreenDetailsAsync();
        }

        [HttpPost]
        [Route("SaveScreenDetails")]
        // Executes the SaveScreenDetails functionality.
        public async Task<ApiResponse> SaveScreenDetails([FromBody] List<ScreenRequest> requests)
        {
            return await menuService.SaveScreenDetailsAsync(requests);
        }

        [HttpPut]
        [Route("UpdateScreenDetails/{id}")]
        // Executes the UpdateScreenDetails functionality.
        public async Task<ApiResponse> UpdateScreenDetails(string id, [FromBody] ScreenRequest request)
        {
            return await menuService.UpdateScreenDetailsAsync(id, request);
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
