using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Filters
{
    public class PermissionAuthorizationFilter : IAsyncAuthorizationFilter
    {
        private readonly string screenCode;
        private readonly string actionType;
        private readonly IMenuService menuService;
        private readonly IRolePermissionService rolePermissionService;

        public PermissionAuthorizationFilter(string screenCode, string actionType, IMenuService menuService, IRolePermissionService rolePermissionService)
        {
            this.screenCode = screenCode;
            this.actionType = actionType;
            this.menuService = menuService;
            this.rolePermissionService = rolePermissionService;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // 1. Check if user is authenticated
            if (context.HttpContext.User.Identity == null || !context.HttpContext.User.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // 2. Extract RoleID from Claims
            var roleIdClaim = context.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "roleID");
            if (roleIdClaim == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            string roleId = roleIdClaim.Value;

            // 3. Find the Menu/Screen requested
            var allMenus = await menuService.GetAllAsync();
            var screen = allMenus.FirstOrDefault(m => m.Level == MenuLevel.Screen && m.ScreenCode == screenCode);
            
            if (screen == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            // 4. Look up Role Permissions
            var rolePermissions = await rolePermissionService.GetByRoleIdAsync(roleId);
            
            // Permissions in this system are stored against the Screen's ParentId
            var rolePermission = rolePermissions.FirstOrDefault(p => p.MenuId == screen.ParentId);

            if (rolePermission == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            // 5. Check specific action type
            bool hasAccess = actionType.ToUpper() switch
            {
                "READ" => rolePermission.CanRead,
                "WRITE" => rolePermission.CanWrite,
                "DELETE" => rolePermission.CanDelete,
                _ => false
            };

            if (!hasAccess)
            {
                context.Result = new ForbidResult();
            }
        }
    }
}
