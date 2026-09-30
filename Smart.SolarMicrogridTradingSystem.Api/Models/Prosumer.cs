using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public static class ProsumerApprovalStatus
    {
        public const string Pending = "Pending";
        public const string Approved = "Approved";
        public const string Rejected = "Rejected";
    }

    public class Prosumer
    {
        /// <summary>
        /// NIC is the primary key as per assignment requirements
        /// </summary>
        [BsonId]
        public string NIC { get; set; } = null!;
        
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        
        /// <summary>
        /// Password hash for local mobile app authentication / server verification
        /// </summary>
        public string PasswordHash { get; set; } = null!;
        
        public string PhoneNumber { get; set; } = null!;
        public string Address { get; set; } = null!;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Pending until a Backoffice/Grid Operator user approves the registration; login is blocked until Approved.
        /// </summary>
        public string ApprovalStatus { get; set; } = ProsumerApprovalStatus.Pending;
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public string? RejectionReason { get; set; }

        /// <summary>
        /// Points at the seeded "Prosumer" Role, so mobile menu access can be granted/revoked
        /// through the same Role Permission screen used for web roles.
        /// </summary>
        public string? RoleId { get; set; }

        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}
