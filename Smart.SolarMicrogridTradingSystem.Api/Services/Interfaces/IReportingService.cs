/*
 * File: IReportingService.cs
 * Description: Contains the implementation for IReportingService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IReportingService
    {
        Task<ApiResponse> GetUserStatisticsAsync();
        Task<ApiResponse> GetProsumerStatisticsAsync();
    }
}
