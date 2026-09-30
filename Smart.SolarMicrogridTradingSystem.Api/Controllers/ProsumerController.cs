using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{

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
        [Route("pending")]
        public async Task<ApiResponse> GetPending()
        {
            return await prosumerService.GetPendingProsumersAsync();
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
            bool isBackofficeUser = User.Claims.Any(c => c.Type == "roleName" && c.Value.Equals("Backoffice", System.StringComparison.OrdinalIgnoreCase));
            return await prosumerService.UpdateProsumerAsync(nic, request, isBackofficeUser);
        }

        [HttpDelete]
        [Route("{nic}")]
        public async Task<ApiResponse> Delete(string nic)
        {
            return await prosumerService.DeleteProsumerAsync(nic);
        }

        [HttpPut]
        [Route("{nic}/approve")]
        public async Task<ApiResponse> Approve(string nic, [FromBody] ApproveProsumerRequest request)
        {
            return await prosumerService.ApproveProsumerAsync(nic, request);
        }

        [HttpPut]
        [Route("{nic}/reject")]
        public async Task<ApiResponse> Reject(string nic, [FromBody] RejectProsumerRequest request)
        {
            return await prosumerService.RejectProsumerAsync(nic, request);
        }
    }
}

