/*
 * File: RolePermission.cs
 * Description: Contains the implementation for RolePermission.
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public class RolePermission
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string RoleId { get; set; } = null!;

        public string MenuId { get; set; } = null!;
        public bool CanRead { get; set; }
        public bool CanWrite { get; set; }
        public bool CanDelete { get; set; }
    }
}
