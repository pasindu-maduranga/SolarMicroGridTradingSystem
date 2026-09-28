using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMongoCollection<Menu> menus;
        private readonly IMongoCollection<RolePermission> rolePermissions;
        private readonly IApiResponseFactory responseFactory;

        public MenuService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            menus = database.GetCollection<Menu>("Menus");
            rolePermissions = database.GetCollection<RolePermission>("RolePermissions");
            this.responseFactory = responseFactory;
        }

        public async Task<List<Menu>> GetAllAsync() => await menus.Find(_ => true).ToListAsync();

        public async Task CreateAsync(Menu menu) => await menus.InsertOneAsync(menu);

        public async Task<ApiResponse> GetParentMenuByRoleAsync(string roleId)
        {
            try
            {
                var all = await GetAllAsync();
                var allowedRolePerms = await rolePermissions.Find(p => p.RoleId == roleId && p.CanRead).ToListAsync();
                var allowedMenuIds = allowedRolePerms.Select(p => p.MenuId).ToHashSet();

                var visibleParentIds = all
                    .Where(m => m.Level == MenuLevel.Menu && allowedMenuIds.Contains(m.Id))
                    .Select(m => m.ParentId)
                    .ToHashSet();

                var result = all
                    .Where(m => m.Level == MenuLevel.ParentMenu && visibleParentIds.Contains(m.Id))
                    .OrderBy(m => m.Order)
                    .Select(ToParentMenuSummary);

                return responseFactory.Success(string.Empty, result);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetAllParentMenuDetailsAsync()
        {
            try
            {
                var all = await GetAllAsync();
                var result = all.Where(m => m.Level == MenuLevel.ParentMenu)
                    .OrderBy(m => m.Order)
                    .Select(ToParentMenuSummary);
                return responseFactory.Success(string.Empty, result);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> SaveParentMenuDetailsAsync(ParentMenuRequest request)
        {
            try
            {
                var menu = new Menu
                {
                    Name = request.ParentMenuName,
                    Icon = request.IconTag,
                    Order = request.MenuOrderNo,
                    ParentId = null,
                    Level = MenuLevel.ParentMenu
                };
                await CreateAsync(menu);
                return responseFactory.Success("Parent menu saved successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateParentMenuDetailsAsync(string id, ParentMenuRequest request)
        {
            try
            {
                var menu = await menus.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (menu == null)
                {
                    return responseFactory.Error("Parent menu not found.");
                }

                menu.Name = request.ParentMenuName;
                menu.Icon = request.IconTag;
                menu.Order = request.MenuOrderNo;

                await menus.ReplaceOneAsync(x => x.Id == id, menu);
                return responseFactory.Success("Parent menu updated successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetAllMenuDetailsAsync()
        {
            try
            {
                var all = await GetAllAsync();
                var result = all.Where(m => m.Level == MenuLevel.Menu)
                    .OrderBy(m => m.Order)
                    .Select(m => new
                    {
                        menuID = m.Id,
                        menuName = m.Name,
                        parentMenuID = m.ParentId,
                        iconTag = m.Icon,
                        menuOrderNo = m.Order
                    });
                return responseFactory.Success(string.Empty, result);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> SaveMenuDetailsAsync(MenuRequest request)
        {
            try
            {
                var menu = new Menu
                {
                    Name = request.MenuName,
                    Icon = request.IconTag,
                    Order = request.MenuOrderNo,
                    ParentId = request.ParentMenuId,
                    Level = MenuLevel.Menu
                };
                await CreateAsync(menu);
                return responseFactory.Success("Menu saved successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateMenuDetailsAsync(string id, MenuRequest request)
        {
            try
            {
                var menu = await menus.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (menu == null)
                {
                    return responseFactory.Error("Menu not found.");
                }

                menu.Name = request.MenuName;
                menu.Icon = request.IconTag;
                menu.Order = request.MenuOrderNo;
                menu.ParentId = request.ParentMenuId;

                await menus.ReplaceOneAsync(x => x.Id == id, menu);
                return responseFactory.Success("Menu updated successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetAllScreenDetailsAsync()
        {
            try
            {
                var all = await GetAllAsync();
                var result = all.Where(m => m.Level == MenuLevel.Screen)
                    .OrderBy(m => m.Order)
                    .Select(m => new
                    {
                        screenID = m.Id,
                        screenName = m.Name,
                        screenCode = m.ScreenCode,
                        menuID = m.ParentId,
                        iconTag = m.Icon,
                        screenOrderNo = m.Order,
                        routePath = m.Route
                    });
                return responseFactory.Success(string.Empty, result);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> SaveScreenDetailsAsync(List<ScreenRequest> requests)
        {
            try
            {
                foreach (var request in requests)
                {
                    var screen = new Menu
                    {
                        Name = request.ScreenName,
                        ScreenCode = request.ScreenCode.ToUpperInvariant(),
                        Icon = request.IconTag,
                        Order = request.ScreenOrderNo,
                        ParentId = request.MenuId,
                        Route = request.RoutePath,
                        Level = MenuLevel.Screen
                    };
                    await CreateAsync(screen);
                }
                return responseFactory.Success("Screen(s) saved successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateScreenDetailsAsync(string id, ScreenRequest request)
        {
            try
            {
                var screen = await menus.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (screen == null)
                {
                    return responseFactory.Error("Screen not found.");
                }

                screen.Name = request.ScreenName;
                screen.ScreenCode = request.ScreenCode.ToUpperInvariant();
                screen.Icon = request.IconTag;
                screen.Order = request.ScreenOrderNo;
                screen.ParentId = request.MenuId;
                screen.Route = request.RoutePath;

                await menus.ReplaceOneAsync(x => x.Id == id, screen);
                return responseFactory.Success("Screen updated successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> DeleteMenuNodeAsync(string id)
        {
            try
            {
                var all = await GetAllAsync();
                if (all.Any(m => m.ParentId == id))
                {
                    return responseFactory.Error("Remove the items under this entry first.");
                }
                await menus.DeleteOneAsync(x => x.Id == id);
                return responseFactory.Success("Removed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        private static object ToParentMenuSummary(Menu m) => new
        {
            parentMenuID = m.Id,
            parentMenuName = m.Name,
            iconTag = m.Icon,
            menuOrderNo = m.Order
        };
    }
}
