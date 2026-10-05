/*
 * File: IProsumerService.cs
 * Description: Contains the implementation for IProsumerService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Http;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces
{
    public interface IProsumerService
    {
        Task<ApiResponse> GetAllProsumersAsync();
        Task<ApiResponse> GetPendingProsumersAsync();
        Task<ApiResponse> GetProsumerByNicAsync(string nic);
        Task<ApiResponse> CreateProsumerAsync(CreateProsumerRequest request);
        Task<ApiResponse> UpdateProsumerAsync(string nic, UpdateProsumerRequest request);
        Task<ApiResponse> UploadProsumerPhotoAsync(string nic, IFormFile file);
        Task<ApiResponse> DeleteProsumerAsync(string nic);
        Task<ApiResponse> ApproveProsumerAsync(string nic, ApproveProsumerRequest request);
        Task<ApiResponse> RejectProsumerAsync(string nic, RejectProsumerRequest request);
    }
}
