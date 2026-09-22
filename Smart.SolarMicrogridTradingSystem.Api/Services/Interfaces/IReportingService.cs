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
