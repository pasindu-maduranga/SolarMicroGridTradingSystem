/*
 * File: ProsumerService.cs
 * Description: Contains the implementation for ProsumerService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
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
        private readonly IMongoCollection<Smart.SolarMicrogridTradingSystem.Api.Models.Role> roles;
        private readonly IApiResponseFactory responseFactory;
        private readonly Cloudinary cloudinary;

        public ProsumerService(IMongoDatabase database, IApiResponseFactory responseFactory, Cloudinary cloudinary)
        {
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            roles = database.GetCollection<Smart.SolarMicrogridTradingSystem.Api.Models.Role>("Roles");
            this.responseFactory = responseFactory;
            this.cloudinary = cloudinary;
        }

        // Executes the GetAllProsumersAsync functionality.
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

        // Executes the GetPendingProsumersAsync functionality.
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

        // Executes the GetProsumerByNicAsync functionality.
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

        // Executes the CreateProsumerAsync functionality.
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

        // Executes the UpdateProsumerAsync functionality.
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

        // Executes the ApproveProsumerAsync functionality.
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

        // Executes the RejectProsumerAsync functionality.
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

        // Executes the DeleteProsumerAsync functionality.
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

        // Executes the UploadProsumerPhotoAsync functionality.
        public async Task<ApiResponse> UploadProsumerPhotoAsync(string nic, IFormFile file)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }
                if (file == null || file.Length == 0)
                {
                    return responseFactory.Error("No photo was uploaded.");
                }

                await using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    // One folder per Prosumer, overwriting the previous photo instead of
                    // accumulating a new Cloudinary asset every time they re-upload.
                    PublicId = $"prosumers/{nic}",
                    Overwrite = true,
                    Transformation = new Transformation().Width(400).Height(400).Crop("fill").Gravity("face")
                };
                var uploadResult = await cloudinary.UploadAsync(uploadParams);
                if (uploadResult.Error != null)
                {
                    return responseFactory.Error(uploadResult.Error.Message);
                }

                prosumer.ProfilePictureUrl = uploadResult.SecureUrl.ToString();
                prosumer.ModifiedDate = DateTime.UtcNow;
                await prosumers.ReplaceOneAsync(x => x.NIC == nic, prosumer);

                return responseFactory.Success("Profile photo updated.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the ToSummary functionality.
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
            profilePictureUrl = prosumer.ProfilePictureUrl,
            approvalStatus = prosumer.ApprovalStatus,
            approvedBy = prosumer.ApprovedBy,
            approvedDate = prosumer.ApprovedDate,
            rejectionReason = prosumer.RejectionReason,
            createdDate = prosumer.CreatedDate
        };
    }
}
