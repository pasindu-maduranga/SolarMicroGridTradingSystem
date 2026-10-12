/*
 * File: Role.cs
 * Description: Contains the implementation for Role.
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public class Role
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string RoleName { get; set; } = null!;
        public int Level { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}
