/*
 * File: INodeService.cs
 * Description: Contains the implementation for INodeService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models;
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

        /// <summary>Sets one or many slots' Rs/kWh price on a node in a single call (single or bulk).</summary>
        Task<ApiResponse> SetSlotPricesAsync(string nodeId, SetSlotPricesRequest request);

        /// <summary>Raw entity lookup for internal service-to-service use (e.g. ReservationService).</summary>
        Task<Node?> GetByIdAsync(string id);

        /// <summary>Flips a single slot's availability atomically. Returns false if the node/slot was not found.</summary>
    }
}
