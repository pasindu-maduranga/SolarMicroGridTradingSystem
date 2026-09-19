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
                if (user == null || !user.IsActive || !PasswordHasher.Verify(login.Password, user.PasswordHash))
                {
                    return responseFactory.Error("Invalid username or password.");
                }

                var role = await roleService.GetByIdAsync(user.RoleId);
                if (role == null || !role.IsActive)
                {
                    return responseFactory.Error("This account has no active role assigned.");
                }

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

                return responseFactory.Success(string.Empty, tokenHandler.WriteToken(token));
            }

            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }
    }
}
