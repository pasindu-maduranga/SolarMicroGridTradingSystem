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
    public class RolePermissionService : IRolePermissionService
    {
        private readonly IMongoCollection<RolePermission> rolePermissions;
        private readonly IMenuService menuService;
        private readonly IApiResponseFactory responseFactory;

        public RolePermissionService(IMongoDatabase database, IMenuService menuService, IApiResponseFactory responseFactory)
        {
            rolePermissions = database.GetCollection<RolePermission>("RolePermissions");
            this.menuService = menuService;
            this.responseFactory = responseFactory;
        }

        public async Task<List<RolePermission>> GetByRoleIdAsync(string roleId) =>
            await rolePermissions.Find(x => x.RoleId == roleId).ToListAsync();

        public async Task SaveRolePermissionsAsync(string roleId, List<RolePermission> permissions)
        {
            await rolePermissions.DeleteManyAsync(x => x.RoleId == roleId);
            if (permissions.Count > 0)
            {
                await rolePermissions.InsertManyAsync(permissions);
            }
        }

        public async Task<ApiResponse> GetPermissionByRoleIdAsync(string loggedRoleId, string assigningRoleId)
        {
            try
            {
                var allMenus = await menuService.GetAllAsync();
                var parentMenus = allMenus.Where(m => m.Level == MenuLevel.ParentMenu).ToList();
                var menus = allMenus.Where(m => m.Level == MenuLevel.Menu).OrderBy(m => m.Order).ToList();
                var existing = await GetByRoleIdAsync(assigningRoleId);

                var screens = menus.Select(m =>
                {
                    var rolePermission = existing.FirstOrDefault(p => p.MenuId == m.Id);
                    var isFullyOpen = rolePermission != null && rolePermission.CanRead && rolePermission.CanWrite && rolePermission.CanDelete;
                    var parentMenu = parentMenus.FirstOrDefault(p => p.Id == m.ParentId);
                    return new
                    {
                        screenID = m.Id,
                        screenName = m.Name,
                        parentMenuID = m.ParentId,
                        parentMenuName = parentMenu?.Name,
                        isOpen = isFullyOpen
                    };
                }).ToList();

                var permissions = new List<object>();
                foreach (var m in menus)
                {
                    var rolePermission = existing.FirstOrDefault(p => p.MenuId == m.Id);
                    permissions.Add(new { permissionID = m.Id + "|READ", screenID = m.Id, permissionName = "View", isAssigned = rolePermission?.CanRead ?? false });
                    permissions.Add(new { permissionID = m.Id + "|WRITE", screenID = m.Id, permissionName = "Add & Edit", isAssigned = rolePermission?.CanWrite ?? false });
                    permissions.Add(new { permissionID = m.Id + "|DELETE", screenID = m.Id, permissionName = "Delete", isAssigned = rolePermission?.CanDelete ?? false });
                }

                return responseFactory.Success(string.Empty, new { screens, permissions, unmodifiedPermissions = permissions });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> SaveRolePermissionAsync(SaveRolePermissionRequest request)
        {
            try
            {
                var byMenu = request.ModifiedList.GroupBy(p => p.ScreenID);
                var newPermissions = byMenu.Select(group => new RolePermission
                {
                    RoleId = request.RoleID,
                    MenuId = group.Key,
                    CanRead = group.Any(p => p.PermissionID.EndsWith("|READ") && p.IsAssigned),
                    CanWrite = group.Any(p => p.PermissionID.EndsWith("|WRITE") && p.IsAssigned),
                    CanDelete = group.Any(p => p.PermissionID.EndsWith("|DELETE") && p.IsAssigned)
                }).ToList();

                await SaveRolePermissionsAsync(request.RoleID, newPermissions);
                return responseFactory.Success("Permissions saved successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }
    }
}
