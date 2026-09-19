using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var roleService = scope.ServiceProvider.GetRequiredService<IRoleService>();
            var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            var menuService = scope.ServiceProvider.GetRequiredService<IMenuService>();
            var rolePermissionService = scope.ServiceProvider.GetRequiredService<IRolePermissionService>();

            var existingRoles = await roleService.GetAllAsync();
            if (existingRoles.Count > 0)
            {
                return;
            }

            var superAdminRole = new Role { RoleName = "Super Admin", Level = 1, IsActive = true };
            await roleService.CreateAsync(superAdminRole);

            var adminUser = new User
            {
                UserName = "admin",
                Email = "admin@gridtrade.lk",
                FirstName = "System",
                LastName = "Administrator",
                PasswordHash = PasswordHasher.Hash("Admin@123"),
                RoleId = superAdminRole.Id!,
                IsActive = true
            };
            await userService.CreateAsync(adminUser);

            var userManagementParent = new Menu
            {
                Name = "User Management",
                Icon = "people",
                Order = 1,
                Level = MenuLevel.ParentMenu
            };
            await menuService.CreateAsync(userManagementParent);

            var usersMenu = new Menu { Name = "Users", Icon = "person", Order = 1, Level = MenuLevel.Menu, ParentId = userManagementParent.Id };
            await menuService.CreateAsync(usersMenu);
            var usersScreen = new Menu { Name = "Users", ScreenCode = "USER", Icon = "person", Order = 1, Level = MenuLevel.Screen, ParentId = usersMenu.Id, Route = "/app/users/listing" };
            await menuService.CreateAsync(usersScreen);

            var rolesMenu = new Menu { Name = "Roles", Icon = "security", Order = 2, Level = MenuLevel.Menu, ParentId = userManagementParent.Id };
            await menuService.CreateAsync(rolesMenu);
            var rolesScreen = new Menu { Name = "Roles", ScreenCode = "ROLE", Icon = "security", Order = 1, Level = MenuLevel.Screen, ParentId = rolesMenu.Id, Route = "/app/roles/listing" };
            await menuService.CreateAsync(rolesScreen);

            var screenManagerMenu = new Menu { Name = "Screen Manager", Icon = "desktop_windows", Order = 3, Level = MenuLevel.Menu, ParentId = userManagementParent.Id };
            await menuService.CreateAsync(screenManagerMenu);
            var screenManagerScreen = new Menu { Name = "Screen Manager", ScreenCode = "SCREENMANAGER", Icon = "desktop_windows", Order = 1, Level = MenuLevel.Screen, ParentId = screenManagerMenu.Id, Route = "/app/screenManager/listing" };
            await menuService.CreateAsync(screenManagerScreen);

            var fullAccessMenus = new List<Menu> { usersMenu, rolesMenu, screenManagerMenu };
            var rolePermissions = fullAccessMenus.Select(menu => new RolePermission
            {
                RoleId = superAdminRole.Id!,
                MenuId = menu.Id!,
                CanRead = true,
                CanWrite = true,
                CanDelete = true
            }).ToList();
            await rolePermissionService.SaveRolePermissionsAsync(superAdminRole.Id!, rolePermissions);
        }
    }
}
