using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class PermissionService : IPermissionService
    {
        private readonly IMenuService menuService;
        private readonly IRolePermissionService rolePermissionService;
        private readonly IApiResponseFactory responseFactory;

        public PermissionService(IMenuService menuService, IRolePermissionService rolePermissionService, IApiResponseFactory responseFactory)
        {
            this.menuService = menuService;
            this.rolePermissionService = rolePermissionService;
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> GetPermissionsByRoleAndScreenAsync(string roleId, string screenCode)
        {
            try
            {
                var allMenus = await menuService.GetAllAsync();
                var screen = allMenus.FirstOrDefault(m => m.Level == MenuLevel.Screen && m.ScreenCode == screenCode);
                if (screen == null)
                {
                    return responseFactory.Success(string.Empty, new List<object>());
                }

                var rolePermissions = await rolePermissionService.GetByRoleIdAsync(roleId);
                var rolePermission = rolePermissions.FirstOrDefault(p => p.MenuId == screen.ParentId);

                var codes = new List<object>();
                if (rolePermission != null)
                {
                    if (rolePermission.CanRead)
                    {
                        codes.Add(new { permissionCode = "VIEW" + screenCode });
                    }
                    if (rolePermission.CanWrite)
                    {
                        codes.Add(new { permissionCode = "ADDEDIT" + screenCode });
                    }
                    if (rolePermission.CanDelete)
                    {
                        codes.Add(new { permissionCode = "DELETE" + screenCode });
                    }
                }

                return responseFactory.Success(string.Empty, codes);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }
    }
}
