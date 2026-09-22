using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IProsumerService
    {
        Task<ApiResponse> GetAllProsumersAsync();
        Task<ApiResponse> GetProsumerByNicAsync(string nic);
        Task<ApiResponse> CreateProsumerAsync(CreateProsumerRequest request);
        Task<ApiResponse> UpdateProsumerAsync(string nic, UpdateProsumerRequest request, bool isBackofficeUser);
        Task<ApiResponse> DeleteProsumerAsync(string nic);
    }
}
