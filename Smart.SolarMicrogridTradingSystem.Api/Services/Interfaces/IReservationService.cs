/*
 * File: IReservationService.cs
 * Description: Contains the implementation for IReservationService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IReservationService
    {
        Task<ApiResponse> CreateReservationAsync(CreateReservationRequest request);
        Task<ApiResponse> GetAllReservationsAsync();
        Task<ApiResponse> GetReservationsByProsumerAsync(string nic);
        Task<ApiResponse> GetReservationsByNodeAsync(string nodeId);
        Task<ApiResponse> VerifyReservationAsync(VerifyReservationRequest request);
        Task<ApiResponse> UpdateReservationAsync(string id, UpdateReservationRequest request);
        Task<ApiResponse> CancelReservationAsync(string id, CancelReservationRequest request);

        /// <summary>True if the node has any reservation still Active - blocks node deactivation.</summary>
        Task<bool> HasActiveReservationsForNodeAsync(string nodeId);
    }
}
