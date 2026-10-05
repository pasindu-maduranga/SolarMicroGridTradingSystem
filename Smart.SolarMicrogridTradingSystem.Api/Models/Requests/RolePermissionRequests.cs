/*
 * File: RolePermissionRequests.cs
 * Description: Contains the implementation for RolePermissionRequests.
 * Author: Smart Solar Microgrid Trading System Team
 */
using System.Collections.Generic;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class PermissionRow
    {
        public string PermissionID { get; set; } = null!;
        public string ScreenID { get; set; } = null!;
        public string PermissionName { get; set; } = null!;
        public bool IsAssigned { get; set; }
    }

    public class SaveRolePermissionRequest
    {
        public List<PermissionRow> UnmodifiedList { get; set; } = new();
        public List<PermissionRow> ModifiedList { get; set; } = new();
        public string RoleID { get; set; } = null!;
    }
}
