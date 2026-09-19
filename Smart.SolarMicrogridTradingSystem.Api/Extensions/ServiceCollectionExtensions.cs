using Microsoft.Extensions.DependencyInjection;
using Smart.SolarMicrogridTradingSystem.Api.Services;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;

namespace Smart.SolarMicrogridTradingSystem.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IApiResponseFactory, ApiResponseFactory>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IRoleService, RoleService>();
            services.AddScoped<IMenuService, MenuService>();
            services.AddScoped<IRolePermissionService, RolePermissionService>();
            services.AddScoped<IPermissionService, PermissionService>();
            services.AddScoped<IMainNavMenuService, MainNavMenuService>();

            return services;
        }
    }
}
