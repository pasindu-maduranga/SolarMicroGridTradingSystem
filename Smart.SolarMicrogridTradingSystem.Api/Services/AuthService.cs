/*
 * File: AuthService.cs
 * Description: Contains the implementation for AuthService.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserService userService;
        private readonly IRoleService roleService;
        private readonly IMongoCollection<Prosumer> prosumers;
        private readonly IConfiguration config;
        private readonly IApiResponseFactory responseFactory;

        public AuthService(IUserService userService, IRoleService roleService, IMongoDatabase database, IConfiguration config, IApiResponseFactory responseFactory)
        {
            this.userService = userService;
            this.roleService = roleService;
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            this.config = config;
            this.responseFactory = responseFactory;
        }

        // Executes the LoginAsync functionality.
        public async Task<ApiResponse> LoginAsync(LoginDto login)
        {
            try
            {
                var identifier = login.UserName?.Trim() ?? string.Empty;

                var user = await userService.GetByUsernameAsync(identifier);
                if (user != null)
                {
                    if (!user.IsActive || !PasswordHasher.Verify(login.Password, user.PasswordHash))
                    {
                        return responseFactory.Error("Invalid username or password.");
                    }

                    var role = await roleService.GetByIdAsync(user.RoleId);
                    if (role == null || !role.IsActive)
                    {
                        return responseFactory.Error("This account has no active role assigned.");
                    }

                    return responseFactory.Success(string.Empty, GenerateToken(
                        userName: user.UserName,
                        subjectId: user.Id!,
                        roleId: user.RoleId,
                        roleLevel: role.Level,
                        roleName: role.RoleName,
                        fullName: $"{user.FirstName} {user.LastName}".Trim()));
                }

                // Not a staff username — try Prosumer login by NIC instead. Prosumers are a
                // separate collection (mobile-only accounts), not part of Users/Roles.
                var prosumer = await prosumers.Find(x => x.NIC == identifier).FirstOrDefaultAsync();
                if (prosumer != null)
                {
                    if (prosumer.ApprovalStatus == ProsumerApprovalStatus.Pending)
                    {
                        return responseFactory.Error("Your account is still pending Backoffice approval.");
                    }
                    if (prosumer.ApprovalStatus == ProsumerApprovalStatus.Rejected)
                    {
                        return responseFactory.Error("Your registration was rejected. Please contact support.");
                    }
                    if (!prosumer.IsActive || !PasswordHasher.Verify(login.Password, prosumer.PasswordHash))
                    {
                        return responseFactory.Error("Invalid NIC or password.");
                    }

                    var allRoles = await roleService.GetAllAsync();
                    var prosumerRole = allRoles.FirstOrDefault(r => r.RoleName == "Prosumer");

                    return responseFactory.Success(string.Empty, GenerateToken(
                        userName: prosumer.NIC,
                        subjectId: prosumer.NIC,
                        roleId: prosumer.RoleId ?? prosumerRole?.Id ?? string.Empty,
                        roleLevel: prosumerRole?.Level ?? 3,
                        roleName: "Prosumer",
                        fullName: $"{prosumer.FirstName} {prosumer.LastName}".Trim()));
                }

                return responseFactory.Error("Invalid username or password.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the GenerateToken functionality.
        private string GenerateToken(string userName, string subjectId, string roleId, int roleLevel, string roleName, string fullName)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(config["JwtSettings:Secret"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("userName", userName),
                    new Claim("roleID", roleId),
                    new Claim("nameid", subjectId),
                    new Claim("roleLevel", roleLevel.ToString()),
                    new Claim("roleName", roleName),
                    new Claim("fullName", fullName)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
