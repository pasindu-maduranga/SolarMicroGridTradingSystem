/*
 * File: UserRequests.cs
 * Description: Contains the implementation for UserRequests.
 * Author: Smart Solar Microgrid Trading System Team
 */
namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class CreateUserRequest
    {
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string RoleId { get; set; } = null!;
        public string? AssignedNodeId { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
    }

    public class UpdateUserRequest
    {
        public string Email { get; set; } = null!;
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string RoleId { get; set; } = null!;
        public string? AssignedNodeId { get; set; }
        public bool IsActive { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string NewPassword { get; set; } = null!;
        public string? ModifiedBy { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string UserId { get; set; } = null!;
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
