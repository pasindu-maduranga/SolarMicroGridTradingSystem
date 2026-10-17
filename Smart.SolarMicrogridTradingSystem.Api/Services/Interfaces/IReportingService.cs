/*
 * File: IReportingService.cs
 * Description: Contains the implementation for IReportingService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IReportingService
    {
        Task<ApiResponse> GetUserStatisticsAsync();
        Task<ApiResponse> GetProsumerStatisticsAsync();
        Task<ApiResponse> GetDashboardSummaryAsync(int tzOffsetMinutes, int days = 14);
        Task<ApiResponse> GetRecentActivityAsync(int limit = 8);

        // Trading Reports
        Task<ApiResponse> GetTradingSummaryAsync(ReportFilter filter);
        Task<ApiResponse> GetProsumerEarningsAsync(ReportFilter filter);

        // Node Reports
        Task<ApiResponse> GetNodePerformanceAsync(ReportFilter filter);
        Task<ApiResponse> GetSlotUtilizationAsync(ReportFilter filter);
        Task<ApiResponse> GetDeliveredVsBookedAsync(ReportFilter filter);

        // Reservation Reports
        Task<ApiResponse> GetReservationStatusAsync(ReportFilter filter);

        // Admin Reports
        Task<ApiResponse> GetOperatorActivityAsync(ReportFilter filter);
        Task<ApiResponse> GetProsumerRegistrationsAsync(ReportFilter filter);
    }
}
