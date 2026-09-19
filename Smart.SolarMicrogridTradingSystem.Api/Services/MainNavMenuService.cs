using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class MainNavMenuService : IMainNavMenuService
    {
        private readonly IMenuService menuService;
        private readonly IRolePermissionService rolePermissionService;
        private readonly IApiResponseFactory responseFactory;

        public MainNavMenuService(IMenuService menuService, IRolePermissionService rolePermissionService, IApiResponseFactory responseFactory)
        {
            this.menuService = menuService;
            this.rolePermissionService = rolePermissionService;
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> GetMenuModelsByRoleAsync(string roleId, string mainMenuId)
        {
            try
            {
                var menus = await menuService.GetAllAsync();
                var perms = await rolePermissionService.GetByRoleIdAsync(roleId);

                var allowedMenuIds = perms.Where(p => p.CanRead).Select(p => p.MenuId).ToHashSet();

                var childMenus = menus
                    .Where(m => m.ParentId == mainMenuId && allowedMenuIds.Contains(m.Id))
                    .OrderBy(m => m.Order)
                    .ToList();

                var result = childMenus.Select(m =>
                {
                    var screens = menus
                        .Where(sub => sub.ParentId == m.Id)
                        .OrderBy(sub => sub.Order)
                        .Select(sub => new
                        {
                            screenID = sub.Id,
                            screenName = sub.Name,
                            screenOrderNo = sub.Order,
                            routePath = sub.Route,
                            iconTag = sub.Icon
                        })
                        .ToList();

                    return new
                    {
                        menuID = m.Id,
                        mainMenuName = m.Name,
                        menuOrderNo = m.Order,
                        iconTag = m.Icon,
                        screenList = screens
                    };
                }).ToList();

                return responseFactory.Success(string.Empty, result);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }
    }
}
