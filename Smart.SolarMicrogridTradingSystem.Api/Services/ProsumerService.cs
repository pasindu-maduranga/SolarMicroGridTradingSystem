using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ProsumerService : IProsumerService
    {
        private readonly IMongoCollection<Prosumer> prosumers;
        private readonly IMongoCollection<Role> roles;
        private readonly IApiResponseFactory responseFactory;

        public ProsumerService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            roles = database.GetCollection<Role>("Roles");
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> GetAllProsumersAsync()
        {
            try
            {
                var result = await prosumers.Find(_ => true).ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetPendingProsumersAsync()
        {
            try
            {
                var result = await prosumers.Find(x => x.ApprovalStatus == ProsumerApprovalStatus.Pending).ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetProsumerByNicAsync(string nic)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }
                return responseFactory.Success(string.Empty, ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> CreateProsumerAsync(CreateProsumerRequest request)
        {
            try
            {
                var existing = await prosumers.Find(x => x.NIC == request.NIC).FirstOrDefaultAsync();
                if (existing != null)
                {
                    return responseFactory.Error("A prosumer with this NIC already exists.");
                }
                
                var existingEmail = await prosumers.Find(x => x.Email == request.Email).FirstOrDefaultAsync();
                if (existingEmail != null)
                {
                    return responseFactory.Error("A prosumer with this email already exists.");
                }

                var prosumerRole = await roles.Find(x => x.RoleName == "Prosumer").FirstOrDefaultAsync();

                var prosumer = new Prosumer
                {
                    NIC = request.NIC.Trim(),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PasswordHash = PasswordHasher.Hash(request.Password),
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    IsActive = request.IsActive,
                    ApprovalStatus = ProsumerApprovalStatus.Pending,
                    RoleId = prosumerRole?.Id,
                    CreatedBy = request.CreatedBy,
                    CreatedDate = DateTime.UtcNow
                };

                await prosumers.InsertOneAsync(prosumer);
                return responseFactory.Success("Registration submitted. Your account is pending approval.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateProsumerAsync(string nic, UpdateProsumerRequest request)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }

                prosumer.FirstName = request.FirstName;
                prosumer.LastName = request.LastName;
                prosumer.Email = request.Email;
                prosumer.PhoneNumber = request.PhoneNumber;
                prosumer.Address = request.Address;
                if (request.Latitude.HasValue) prosumer.Latitude = request.Latitude.Value;
                if (request.Longitude.HasValue) prosumer.Longitude = request.Longitude.Value;
                prosumer.IsActive = request.IsActive;
                prosumer.ModifiedBy = request.ModifiedBy;
                prosumer.ModifiedDate = DateTime.UtcNow;

                await prosumers.ReplaceOneAsync(x => x.NIC == nic, prosumer);
                return responseFactory.Success("Prosumer updated successfully.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> ApproveProsumerAsync(string nic, ApproveProsumerRequest request)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }

                prosumer.ApprovalStatus = ProsumerApprovalStatus.Approved;
                prosumer.ApprovedBy = request.ApprovedBy;
                prosumer.ApprovedDate = DateTime.UtcNow;
                prosumer.RejectionReason = null;

                await prosumers.ReplaceOneAsync(x => x.NIC == nic, prosumer);
                return responseFactory.Success("Prosumer approved successfully.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> RejectProsumerAsync(string nic, RejectProsumerRequest request)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }

                prosumer.ApprovalStatus = ProsumerApprovalStatus.Rejected;
                prosumer.RejectionReason = request.Reason;
                prosumer.ApprovedBy = request.RejectedBy;
                prosumer.ApprovedDate = DateTime.UtcNow;

                await prosumers.ReplaceOneAsync(x => x.NIC == nic, prosumer);
                return responseFactory.Success("Prosumer registration rejected.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> DeleteProsumerAsync(string nic)
        {
            try
            {
                await prosumers.DeleteOneAsync(x => x.NIC == nic);
                return responseFactory.Success("Prosumer removed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        private static object ToSummary(Prosumer prosumer) => new
        {
            nic = prosumer.NIC,
            firstName = prosumer.FirstName,
            lastName = prosumer.LastName,
            email = prosumer.Email,
            phoneNumber = prosumer.PhoneNumber,
            address = prosumer.Address,
            latitude = prosumer.Latitude,
            longitude = prosumer.Longitude,
            isActive = prosumer.IsActive,
            approvalStatus = prosumer.ApprovalStatus,
            approvedBy = prosumer.ApprovedBy,
            approvedDate = prosumer.ApprovedDate,
            rejectionReason = prosumer.RejectionReason,
            createdDate = prosumer.CreatedDate
        };
    }
}
