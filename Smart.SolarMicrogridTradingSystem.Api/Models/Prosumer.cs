using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
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

        public bool IsActive { get; set; } = true;

        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}
