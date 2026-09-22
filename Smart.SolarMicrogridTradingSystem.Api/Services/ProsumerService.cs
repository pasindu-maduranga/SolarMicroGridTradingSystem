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
        private readonly IApiResponseFactory responseFactory;

        public ProsumerService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            prosumers = database.GetCollection<Prosumer>("Prosumers");
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

                var prosumer = new Prosumer
                {
                    NIC = request.NIC,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    Email = request.Email,
                    PasswordHash = PasswordHasher.Hash(request.Password),
                    PhoneNumber = request.PhoneNumber,
                    Address = request.Address,
                    IsActive = request.IsActive,
                    CreatedBy = request.CreatedBy,
                    CreatedDate = DateTime.UtcNow
                };

                await prosumers.InsertOneAsync(prosumer);
                return responseFactory.Success("Prosumer created successfully.", ToSummary(prosumer));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateProsumerAsync(string nic, UpdateProsumerRequest request, bool isBackofficeUser)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == nic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }

                // Deactivated accounts can only be reactivated by a Backoffice officer.
                if (!prosumer.IsActive && request.IsActive && !isBackofficeUser)
                {
                    return responseFactory.Error("Only Backoffice users can reactivate deactivated prosumer accounts.");
                }

                prosumer.FirstName = request.FirstName;
                prosumer.LastName = request.LastName;
                prosumer.Email = request.Email;
                prosumer.PhoneNumber = request.PhoneNumber;
                prosumer.Address = request.Address;
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
            isActive = prosumer.IsActive,
            createdDate = prosumer.CreatedDate
        };
    }
}
