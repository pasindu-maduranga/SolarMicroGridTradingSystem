/*
 * File: ReportingController.cs
 * Description: Contains the implementation for ReportingController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class ReportingController : ControllerBase
    {
        private readonly IReportingService reportingService;

        public ReportingController(IReportingService reportingService)
        {
            this.reportingService = reportingService;
        }

        [HttpGet]
        [Route("users/stats")]
        // Executes the GetUserStats functionality.
        public async Task<ApiResponse> GetUserStats()
        {
            return await reportingService.GetUserStatisticsAsync();
        }

        [HttpGet]
        [Route("prosumers/stats")]
        // Executes the GetProsumerStats functionality.
        public async Task<ApiResponse> GetProsumerStats()
        {
            return await reportingService.GetProsumerStatisticsAsync();
        }
    }
}

