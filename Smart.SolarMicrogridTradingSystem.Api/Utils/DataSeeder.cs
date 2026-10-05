/*
 * File: DataSeeder.cs
 * Description: Contains the implementation for DataSeeder.
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    public static class DataSeeder
    {
        // Executes the FindMenu functionality.
        private static Menu FindMenu(List<Menu> menus, string name, int level, string? parentId = null) =>
                    menus.FirstOrDefault(m => m.Level == level && m.Name == name && (parentId == null || m.ParentId == parentId))!;

        // Executes the SeedAsync functionality.
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

        /// <summary>
        /// Idempotent — safe to run on every startup against an already-populated database.
        /// Adds the Prosumer role, the Prosumer Management / Reservations web screens, the
        /// Prosumer Portal / Grid Operator Mobile screens (permission-gated mobile menus),
        /// and two sample Prosumers (one Pending, one Approved) if they don't already exist.
        /// </summary>
        public static async Task SeedProsumerAndReservationFeaturesAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var roleService = scope.ServiceProvider.GetRequiredService<IRoleService>();
            var menuService = scope.ServiceProvider.GetRequiredService<IMenuService>();
            var rolePermissionService = scope.ServiceProvider.GetRequiredService<IRolePermissionService>();
            var database = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();
            var prosumers = database.GetCollection<Prosumer>("Prosumers");

            var roles = await roleService.GetAllAsync();
            var superAdminRole = roles.FirstOrDefault(r => r.RoleName == "Super Admin");
            var backofficeRole = roles.FirstOrDefault(r => r.RoleName == "Backoffice");
            var gridOperatorRole = roles.FirstOrDefault(r => r.RoleName == "Grid Operator");

            var prosumerRole = roles.FirstOrDefault(r => r.RoleName == "Prosumer");
            if (prosumerRole == null)
            {
                prosumerRole = new Role { RoleName = "Prosumer", Level = 3, IsActive = true };
                await roleService.CreateAsync(prosumerRole);
            }

            var menus = await menuService.GetAllAsync();

            async Task<Menu> EnsureParentMenu(string name, string icon, int order)
            {
                var existing = FindMenu(menus, name, MenuLevel.ParentMenu);
                if (existing != null) return existing;
                var created = new Menu { Name = name, Icon = icon, Order = order, Level = MenuLevel.ParentMenu };
                await menuService.CreateAsync(created);
                menus.Add(created);
                return created;
            }

            async Task<Menu> EnsureMenu(string name, string icon, int order, string parentId)
            {
                var existing = FindMenu(menus, name, MenuLevel.Menu, parentId);
                if (existing != null) return existing;
                var created = new Menu { Name = name, Icon = icon, Order = order, Level = MenuLevel.Menu, ParentId = parentId };
                await menuService.CreateAsync(created);
                menus.Add(created);
                return created;
            }

            async Task<Menu> EnsureScreen(string name, string screenCode, string icon, int order, string menuId, string? route)
            {
                var existing = menus.FirstOrDefault(m => m.Level == MenuLevel.Screen && m.ScreenCode == screenCode);
                if (existing != null) return existing;
                var created = new Menu { Name = name, ScreenCode = screenCode, Icon = icon, Order = order, Level = MenuLevel.Screen, ParentId = menuId, Route = route };
                await menuService.CreateAsync(created);
                menus.Add(created);
                return created;
            }

            // --- Web: Prosumer Management (profiles + approvals) ---
            var prosumerMgmtParent = await EnsureParentMenu("Prosumer Management", "how_to_reg", 10);
            var prosumerProfilesMenu = await EnsureMenu("Prosumer Profiles", "badge", 1, prosumerMgmtParent.Id!);
            var prosumerProfilesScreen = await EnsureScreen("Prosumer Profiles", "PROSUMERPROFILE", "badge", 1, prosumerProfilesMenu.Id!, "/app/prosumers/profiles");
            var prosumerApprovalsMenu = await EnsureMenu("Prosumer Approvals", "fact_check", 2, prosumerMgmtParent.Id!);
            var prosumerApprovalsScreen = await EnsureScreen("Prosumer Approvals", "PROSUMERAPPROVAL", "fact_check", 1, prosumerApprovalsMenu.Id!, "/app/prosumers/approvals");

            // --- Web: Reservations viewer ---
            var reservationsParent = await EnsureParentMenu("Reservations", "event_available", 11);
            var reservationsMenu = await EnsureMenu("Reservations", "event_available", 1, reservationsParent.Id!);
            var reservationsScreen = await EnsureScreen("Reservations", "RESERVATIONS", "event_available", 1, reservationsMenu.Id!, "/app/reservations/listing");

            // --- Mobile: Prosumer Portal (Prosumer-only) ---
            var prosumerPortalParent = await EnsureParentMenu("Prosumer Portal", "solar_power", 100);
            var reserveMenu = await EnsureMenu("Reserve Energy", "ev_station", 1, prosumerPortalParent.Id!);
            await EnsureScreen("Reserve Energy", "RESERVESLOT", "ev_station", 1, reserveMenu.Id!, "mobile/reserve");
            var myReservationsMenu = await EnsureMenu("My Reservations", "receipt_long", 2, prosumerPortalParent.Id!);
            await EnsureScreen("My Reservations", "MYRESERVATIONS", "receipt_long", 1, myReservationsMenu.Id!, "mobile/myReservations");
            var earningsMenu = await EnsureMenu("Earnings", "payments", 3, prosumerPortalParent.Id!);
            await EnsureScreen("Earnings", "EARNINGS", "payments", 1, earningsMenu.Id!, "mobile/earnings");

            // --- Mobile: Grid Operator Mobile (subset of the Grid Operator role) ---
            var gridOperatorMobileParent = await EnsureParentMenu("Grid Operator Mobile", "phone_android", 101);
            var verifyMenu = await EnsureMenu("Verify Reservation", "qr_code_scanner", 1, gridOperatorMobileParent.Id!);
            await EnsureScreen("Verify Reservation", "VERIFYRESERVATION", "qr_code_scanner", 1, verifyMenu.Id!, "mobile/verify");
            var mySlotsMenu = await EnsureMenu("My Node Slots", "battery_charging_full", 2, gridOperatorMobileParent.Id!);
            await EnsureScreen("My Node Slots", "MYNODESLOTS", "battery_charging_full", 1, mySlotsMenu.Id!, "mobile/mySlots");
            var operatorBookingsMenu = await EnsureMenu("My Bookings", "event_note", 3, gridOperatorMobileParent.Id!);
            await EnsureScreen("My Bookings", "OPERATORBOOKINGS", "event_note", 1, operatorBookingsMenu.Id!, "mobile/bookings");
            var transactionHistoryMenu = await EnsureMenu("Transaction History", "receipt", 4, gridOperatorMobileParent.Id!);
            await EnsureScreen("Transaction History", "TRANSACTIONHISTORY", "receipt", 1, transactionHistoryMenu.Id!, "mobile/transactions");

            // --- Permissions ---
            async Task GrantFullAccess(string roleId, params string[] menuIds)
            {
                var existingPerms = await rolePermissionService.GetByRoleIdAsync(roleId);
                foreach (var menuId in menuIds)
                {
                    if (existingPerms.Any(p => p.MenuId == menuId)) continue;
                    existingPerms.Add(new RolePermission { RoleId = roleId, MenuId = menuId, CanRead = true, CanWrite = true, CanDelete = true });
                }
                await rolePermissionService.SaveRolePermissionsAsync(roleId, existingPerms);
            }

            async Task GrantReadOnly(string roleId, params string[] menuIds)
            {
                var existingPerms = await rolePermissionService.GetByRoleIdAsync(roleId);
                foreach (var menuId in menuIds)
                {
                    if (existingPerms.Any(p => p.MenuId == menuId)) continue;
                    existingPerms.Add(new RolePermission { RoleId = roleId, MenuId = menuId, CanRead = true, CanWrite = false, CanDelete = false });
                }
                await rolePermissionService.SaveRolePermissionsAsync(roleId, existingPerms);
            }

            if (superAdminRole != null)
            {
                await GrantFullAccess(superAdminRole.Id!, prosumerProfilesMenu.Id!, prosumerApprovalsMenu.Id!, reservationsMenu.Id!);
            }
            if (backofficeRole != null)
            {
                await GrantFullAccess(backofficeRole.Id!, prosumerProfilesMenu.Id!, prosumerApprovalsMenu.Id!, reservationsMenu.Id!);
            }
            if (gridOperatorRole != null)
            {
                await GrantReadOnly(gridOperatorRole.Id!, reservationsMenu.Id!);
                await GrantFullAccess(gridOperatorRole.Id!, verifyMenu.Id!, mySlotsMenu.Id!, operatorBookingsMenu.Id!, transactionHistoryMenu.Id!);
            }
            await GrantFullAccess(prosumerRole.Id!, reserveMenu.Id!, myReservationsMenu.Id!, earningsMenu.Id!);

            // --- Sample Prosumers for testing (Pending + Approved) ---
            var pendingExists = await prosumers.Find(x => x.NIC == "200201001234").AnyAsync();
            if (!pendingExists)
            {
                await prosumers.InsertOneAsync(new Prosumer
                {
                    NIC = "200201001234",
                    FirstName = "Kasun",
                    LastName = "Perera",
                    Email = "kasun.pending@example.com",
                    PasswordHash = PasswordHasher.Hash("Prosumer@123"),
                    PhoneNumber = "0771234567",
                    Address = "Colombo, Sri Lanka",
                    IsActive = true,
                    ApprovalStatus = ProsumerApprovalStatus.Pending,
                    RoleId = prosumerRole.Id
                });
            }

            var approvedExists = await prosumers.Find(x => x.NIC == "903456789V").AnyAsync();
            if (!approvedExists)
            {
                await prosumers.InsertOneAsync(new Prosumer
                {
                    NIC = "903456789V",
                    FirstName = "Nimal",
                    LastName = "Silva",
                    Email = "nimal.approved@example.com",
                    PasswordHash = PasswordHasher.Hash("Prosumer@123"),
                    PhoneNumber = "0777654321",
                    Address = "Kandy, Sri Lanka",
                    IsActive = true,
                    ApprovalStatus = ProsumerApprovalStatus.Approved,
                    ApprovedBy = "Seed",
                    ApprovedDate = DateTime.UtcNow,
                    RoleId = prosumerRole.Id
                });
            }
        }
    }
}
