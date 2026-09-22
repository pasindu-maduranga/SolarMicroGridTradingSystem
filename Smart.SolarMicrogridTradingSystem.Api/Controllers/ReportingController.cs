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
        public async Task<ApiResponse> GetUserStats()
        {
            return await reportingService.GetUserStatisticsAsync();
        }

        [HttpGet]
        [Route("prosumers/stats")]
        public async Task<ApiResponse> GetProsumerStats()
        {
            return await reportingService.GetProsumerStatisticsAsync();
        }
    }
}
