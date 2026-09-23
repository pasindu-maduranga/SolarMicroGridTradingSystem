using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserService userService;
        private readonly IRoleService roleService;
        private readonly IConfiguration config;
        private readonly IApiResponseFactory responseFactory;

        public AuthService(IUserService userService, IRoleService roleService, IConfiguration config, IApiResponseFactory responseFactory)
        {
            this.userService = userService;
            this.roleService = roleService;
            this.config = config;
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> LoginAsync(LoginDto login)
        {
            try
            {
                var user = await userService.GetByUsernameAsync(login.UserName);
                
                //Check Account Status
                if (!CheckAccountStatus(user))
                {
                    return responseFactory.Error("Invalid username or password.");
                }

                //Validate Credentials
                if (!ValidateCredentials(login.Password, user.PasswordHash))
                {
                    return responseFactory.Error("Invalid username or password.");
                }

                var role = await roleService.GetByIdAsync(user.RoleId);
                if (role == null || !role.IsActive)
                {
                    return responseFactory.Error("This account has no active role assigned.");
                }

                //Generate Token
                var token = GenerateToken(user, role);

                return responseFactory.Success(string.Empty, token);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        //Validate user credentials against stored hash
        private bool ValidateCredentials(string enteredPassword, string storedHash)
        {
            return PasswordHasher.Verify(enteredPassword, storedHash);
        }

        //Check if user exists and account is active
        private bool CheckAccountStatus(User user)
        {
            return user != null && user.IsActive;
        }

        // Generate JWT Token for the authenticated user
        private string GenerateToken(User user, Role role)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(config["JwtSettings:Secret"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("userName", user.UserName),
                    new Claim("roleID", user.RoleId),
                    new Claim("nameid", user.Id!),
                    new Claim("roleLevel", role.Level.ToString()),
                    new Claim("roleName", role.RoleName)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Get the current user
        public async Task<User?> GetCurrentUserAsync(ClaimsPrincipal principal)
        {
            var usernameClaim = principal?.FindFirst("userName")?.Value;
            if (string.IsNullOrEmpty(usernameClaim)) return null;
            
            return await userService.GetByUsernameAsync(usernameClaim);
        }
    }
}
