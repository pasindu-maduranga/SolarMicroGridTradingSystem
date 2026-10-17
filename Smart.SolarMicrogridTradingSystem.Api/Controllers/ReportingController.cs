/*
 * File: ReportingController.cs
 * Description: Contains the implementation for ReportingController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
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

        [HttpGet]
        [Route("dashboard")]
        // Executes the GetDashboardSummary functionality.
        public async Task<ApiResponse> GetDashboardSummary([FromQuery] int tzOffsetMinutes = 0, [FromQuery] int days = 14)
        {
            return await reportingService.GetDashboardSummaryAsync(tzOffsetMinutes, days);
        }

        [HttpGet]
        [Route("recent-activity")]
        // Executes the GetRecentActivity functionality.
        public async Task<ApiResponse> GetRecentActivity([FromQuery] int limit = 8)
        {
            return await reportingService.GetRecentActivityAsync(limit);
        }

        [HttpGet]
        [Route("trading-summary")]
        // Executes the GetTradingSummary functionality.
        public async Task<ApiResponse> GetTradingSummary([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetTradingSummaryAsync(filter);
        }

        [HttpGet]
        [Route("prosumer-earnings")]
        // Executes the GetProsumerEarnings functionality.
        public async Task<ApiResponse> GetProsumerEarnings([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetProsumerEarningsAsync(filter);
        }

        [HttpGet]
        [Route("node-performance")]
        // Executes the GetNodePerformance functionality.
        public async Task<ApiResponse> GetNodePerformance([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetNodePerformanceAsync(filter);
        }

        [HttpGet]
        [Route("slot-utilization")]
        // Executes the GetSlotUtilization functionality.
        public async Task<ApiResponse> GetSlotUtilization([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetSlotUtilizationAsync(filter);
        }

        [HttpGet]
        [Route("delivered-vs-booked")]
        // Executes the GetDeliveredVsBooked functionality.
        public async Task<ApiResponse> GetDeliveredVsBooked([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetDeliveredVsBookedAsync(filter);
        }

        [HttpGet]
        [Route("reservation-status")]
        // Executes the GetReservationStatus functionality.
        public async Task<ApiResponse> GetReservationStatus([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetReservationStatusAsync(filter);
        }

        [HttpGet]
        [Route("operator-activity")]
        // Executes the GetOperatorActivity functionality.
        public async Task<ApiResponse> GetOperatorActivity([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetOperatorActivityAsync(filter);
        }

        [HttpGet]
        [Route("prosumer-registrations")]
        // Executes the GetProsumerRegistrations functionality.
        public async Task<ApiResponse> GetProsumerRegistrations([FromQuery] ReportFilter filter)
        {
            return await reportingService.GetProsumerRegistrationsAsync(filter);
        }
    }
}

