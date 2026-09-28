using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface INodeService
    {
        Task<ApiResponse> GetAllNodesAsync();
        Task<ApiResponse> GetNodeByIdAsync(string id);
        Task<ApiResponse> CreateNodeAsync(NodeRequest request);
        Task<ApiResponse> UpdateNodeAsync(string id, NodeRequest request);
        Task<ApiResponse> DeleteNodeAsync(string id);
        Task<ApiResponse> GetAvailableGridOperatorsAsync(string? excludeNodeId);
        Task<ApiResponse> AssignGridOperatorAsync(string nodeId, string? operatorUserId);
    }
}
