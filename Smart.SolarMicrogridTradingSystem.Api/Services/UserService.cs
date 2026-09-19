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
    public class UserService : IUserService
    {
        private readonly IMongoCollection<User> users;
        private readonly IApiResponseFactory responseFactory;

        public UserService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            users = database.GetCollection<User>("Users");
            this.responseFactory = responseFactory;
        }

        public async Task<User?> GetByUsernameAsync(string username) =>
            await users.Find(x => x.UserName == username).FirstOrDefaultAsync();

        public async Task CreateAsync(User user) => await users.InsertOneAsync(user);

        public async Task<ApiResponse> GetAllUsersAsync()
        {
            try
            {
                var result = await users.Find(_ => true).ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetUserByIdAsync(string id)
        {
            try
            {
                var user = await users.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (user == null)
                {
                    return responseFactory.Error("User not found.");
                }
                return responseFactory.Success(string.Empty, ToSummary(user));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> CreateUserAsync(CreateUserRequest request)
        {
            try
            {
                if (!ObjectIdHelper.IsValid(request.RoleId))
                {
                    return responseFactory.Error("Please select a role.");
                }

                var existing = await GetByUsernameAsync(request.UserName);
                if (existing != null)
                {
                    return responseFactory.Error("A user with this username already exists.");
                }

                var user = new User
                {
                    UserName = request.UserName,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PasswordHash = PasswordHasher.Hash(request.Password),
                    RoleId = request.RoleId,
                    AssignedNodeId = ObjectIdHelper.NormalizeOrNull(request.AssignedNodeId),
                    IsActive = request.IsActive,
                    CreatedBy = request.CreatedBy,
                    CreatedDate = DateTime.UtcNow
                };

                await CreateAsync(user);
                return responseFactory.Success("User created successfully.", ToSummary(user));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateUserAsync(string id, UpdateUserRequest request)
        {
            try
            {
                if (!ObjectIdHelper.IsValid(request.RoleId))
                {
                    return responseFactory.Error("Please select a role.");
                }

                var user = await users.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (user == null)
                {
                    return responseFactory.Error("User not found.");
                }

                user.Email = request.Email;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.RoleId = request.RoleId;
                user.AssignedNodeId = ObjectIdHelper.NormalizeOrNull(request.AssignedNodeId);
                user.IsActive = request.IsActive;
                user.ModifiedBy = request.ModifiedBy;
                user.ModifiedDate = DateTime.UtcNow;

                await users.ReplaceOneAsync(x => x.Id == id, user);
                return responseFactory.Success("User updated successfully.", ToSummary(user));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> ResetPasswordAsync(string id, ResetPasswordRequest request)
        {
            try
            {
                var user = await users.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (user == null)
                {
                    return responseFactory.Error("User not found.");
                }

                user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
                user.ModifiedBy = request.ModifiedBy;
                user.ModifiedDate = DateTime.UtcNow;

                await users.ReplaceOneAsync(x => x.Id == id, user);
                return responseFactory.Success("Password reset successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> ChangePasswordAsync(ChangePasswordRequest request)
        {
            try
            {
                var user = await users.Find(x => x.Id == request.UserId).FirstOrDefaultAsync();
                if (user == null || !PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
                {
                    return responseFactory.Error("Current password is incorrect.");
                }

                user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
                user.ModifiedDate = DateTime.UtcNow;

                await users.ReplaceOneAsync(x => x.Id == request.UserId, user);
                return responseFactory.Success("Password changed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> DeleteUserAsync(string id)
        {
            try
            {
                await users.DeleteOneAsync(x => x.Id == id);
                return responseFactory.Success("User removed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        private static object ToSummary(User user) => new
        {
            userID = user.Id,
            userName = user.UserName,
            email = user.Email,
            firstName = user.FirstName,
            lastName = user.LastName,
            isActive = user.IsActive,
            roleID = user.RoleId,
            assignedNodeId = user.AssignedNodeId,
            createdDate = user.CreatedDate
        };
    }
}
