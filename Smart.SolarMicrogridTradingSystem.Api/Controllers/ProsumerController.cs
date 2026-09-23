using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProsumerController : ControllerBase
    {
        private readonly IProsumerService prosumerService;

        public ProsumerController(IProsumerService prosumerService)
        {
            this.prosumerService = prosumerService;
        }

        [HttpGet]
        public async Task<ApiResponse> Get()
        {
            return await prosumerService.GetAllProsumersAsync();
        }

        [HttpGet]
        [Route("{nic}")]
        public async Task<ApiResponse> GetByNic(string nic)
        {
            return await prosumerService.GetProsumerByNicAsync(nic);
        }

        [HttpPost]
        public async Task<ApiResponse> Post([FromBody] CreateProsumerRequest request)
        {
            return await prosumerService.CreateProsumerAsync(request);
        }

        [HttpPut]
        [Route("{nic}")]
        public async Task<ApiResponse> Put(string nic, [FromBody] UpdateProsumerRequest request)
        {
            // Assuming Backoffice users have the role name "Backoffice"
            bool isBackofficeUser = User.Claims.Any(c => c.Type == "roleName" && c.Value.Equals("Backoffice", System.StringComparison.OrdinalIgnoreCase));
            
            // Note: If authentication is not strictly enforced yet on this route, we will fallback to allowing updates
            // (or we can just check if user is authenticated).
            // For now, if there's no logged in user context, we will treat it as a false backoffice user.
            
            return await prosumerService.UpdateProsumerAsync(nic, request, isBackofficeUser);
        }

        [HttpDelete]
        [Route("{nic}")]
        public async Task<ApiResponse> Delete(string nic)
        {
            return await prosumerService.DeleteProsumerAsync(nic);
        }
    }
}

