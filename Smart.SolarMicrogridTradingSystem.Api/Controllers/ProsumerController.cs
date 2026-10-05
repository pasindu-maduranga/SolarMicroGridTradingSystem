/*
 * File: ProsumerController.cs
 * Description: Contains the implementation for ProsumerController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
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
        // Executes the Get functionality.
        public async Task<ApiResponse> Get()
        {
            return await prosumerService.GetAllProsumersAsync();
        }

        [HttpGet]
        [Route("pending")]
        // Executes the GetPending functionality.
        public async Task<ApiResponse> GetPending()
        {
            return await prosumerService.GetPendingProsumersAsync();
        }

        [HttpGet]
        [Route("{nic}")]
        // Executes the GetByNic functionality.
        public async Task<ApiResponse> GetByNic(string nic)
        {
            return await prosumerService.GetProsumerByNicAsync(nic);
        }

        [HttpPost]
        // Executes the Post functionality.
        public async Task<ApiResponse> Post([FromBody] CreateProsumerRequest request)
        {
            return await prosumerService.CreateProsumerAsync(request);
        }

        [HttpPut]
        [Route("{nic}")]
        // Executes the Put functionality.
        public async Task<ApiResponse> Put(string nic, [FromBody] UpdateProsumerRequest request)
        {
            return await prosumerService.UpdateProsumerAsync(nic, request);
        }

        [HttpPost]
        [Route("{nic}/photo")]
        // Executes the UploadPhoto functionality.
        public async Task<ApiResponse> UploadPhoto(string nic, IFormFile file)
        {
            return await prosumerService.UploadProsumerPhotoAsync(nic, file);
        }

        [HttpDelete]
        [Route("{nic}")]
        // Executes the Delete functionality.
        public async Task<ApiResponse> Delete(string nic)
        {
            return await prosumerService.DeleteProsumerAsync(nic);
        }

        [HttpPut]
        [Route("{nic}/approve")]
        // Executes the Approve functionality.
        public async Task<ApiResponse> Approve(string nic, [FromBody] ApproveProsumerRequest request)
        {
            return await prosumerService.ApproveProsumerAsync(nic, request);
        }

        [HttpPut]
        [Route("{nic}/reject")]
        // Executes the Reject functionality.
        public async Task<ApiResponse> Reject(string nic, [FromBody] RejectProsumerRequest request)
        {
            return await prosumerService.RejectProsumerAsync(nic, request);
        }
    }
}

