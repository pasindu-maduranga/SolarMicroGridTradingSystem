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
        public async Task<ApiResponse> GetParentMenuByRole([FromQuery] string roleID)
        {
            return await menuService.GetParentMenuByRoleAsync();
        }

        [HttpGet]
        [Route("GetAllParentMenuDetails")]
        public async Task<ApiResponse> GetAllParentMenuDetails()
        {
            return await menuService.GetAllParentMenuDetailsAsync();
        }

        [HttpPost]
        [Route("SaveParentMenuDetails")]
        public async Task<ApiResponse> SaveParentMenuDetails([FromBody] ParentMenuRequest request)
        {
            return await menuService.SaveParentMenuDetailsAsync(request);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<ApiResponse> Delete(string id)
        {
            return await menuService.DeleteMenuNodeAsync(id);
        }
    }
}
