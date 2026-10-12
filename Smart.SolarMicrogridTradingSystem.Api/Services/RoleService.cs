/*
 * File: RoleService.cs
 * Description: Contains the implementation for RoleService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class RoleService : IRoleService
    {
        private readonly IMongoCollection<Role> roles;
        private readonly IApiResponseFactory responseFactory;

        public RoleService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            roles = database.GetCollection<Role>("Roles");
            this.responseFactory = responseFactory;
        }

        // Executes the GetAllAsync functionality.
        public async Task<List<Role>> GetAllAsync() => await roles.Find(_ => true).ToListAsync();

        public async Task<Role?> GetByIdAsync(string id) => await roles.Find(x => x.Id == id).FirstOrDefaultAsync();

        // Executes the CreateAsync functionality.
        public async Task CreateAsync(Role role) => await roles.InsertOneAsync(role);

        // Executes the GetAllRolesAsync functionality.
        public async Task<ApiResponse> GetAllRolesAsync()
        {
            try
            {
                var result = await roles.Find(_ => true).ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the GetRoleByIdAsync functionality.
        public async Task<ApiResponse> GetRoleByIdAsync(string id)
        {
            try
            {
                var role = await GetByIdAsync(id);
                if (role == null)
                {
                    return responseFactory.Error("Role not found.");
                }
                return responseFactory.Success(string.Empty, ToSummary(role));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the CreateRoleAsync functionality.
        public async Task<ApiResponse> CreateRoleAsync(RoleRequest request)
        {
            try
            {
                var role = new Role
                {
                    RoleName = request.RoleName,
                    Level = request.Level,
                    IsActive = request.IsActive,
                    CreatedBy = request.CreatedBy,
                    CreatedDate = DateTime.UtcNow
                };
                await CreateAsync(role);
                return responseFactory.Success("Role created successfully.", ToSummary(role));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the UpdateRoleAsync functionality.
        public async Task<ApiResponse> UpdateRoleAsync(string id, RoleRequest request)
        {
            try
            {
                var role = await GetByIdAsync(id);
                if (role == null)
                {
                    return responseFactory.Error("Role not found.");
                }

                role.RoleName = request.RoleName;
                role.Level = request.Level;
                role.IsActive = request.IsActive;
                role.ModifiedBy = request.ModifiedBy;
                role.ModifiedDate = DateTime.UtcNow;

                await roles.ReplaceOneAsync(x => x.Id == id, role);
                return responseFactory.Success("Role updated successfully.", ToSummary(role));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the DeleteRoleAsync functionality.
        public async Task<ApiResponse> DeleteRoleAsync(string id)
        {
            try
            {
                await roles.DeleteOneAsync(x => x.Id == id);
                return responseFactory.Success("Role removed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the ToSummary functionality.
        private static object ToSummary(Role role) => new
        {
            roleID = role.Id,
            roleName = role.RoleName,
            level = role.Level,
            isActive = role.IsActive,
            createdDate = role.CreatedDate
        };
    }
}
