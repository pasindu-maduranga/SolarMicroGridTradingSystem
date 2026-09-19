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
        public async Task<ApiResponse> GetAllMenuDetails()
        {
            return await menuService.GetAllMenuDetailsAsync();
        }

        [HttpPost]
        [Route("SaveMenuDetails")]
        public async Task<ApiResponse> SaveMenuDetails([FromBody] MenuRequest request)
        {
            return await menuService.SaveMenuDetailsAsync(request);
        }

        [HttpGet]
        [Route("GetAllScreenDetails")]
        public async Task<ApiResponse> GetAllScreenDetails()
        {
            return await menuService.GetAllScreenDetailsAsync();
        }

        [HttpPost]
        [Route("SaveScreenDetails")]
        public async Task<ApiResponse> SaveScreenDetails([FromBody] List<ScreenRequest> requests)
        {
            return await menuService.SaveScreenDetailsAsync(requests);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<ApiResponse> Delete(string id)
        {
            return await menuService.DeleteMenuNodeAsync(id);
        }
    }
}
