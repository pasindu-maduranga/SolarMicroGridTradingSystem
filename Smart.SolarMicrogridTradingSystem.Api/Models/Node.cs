using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public class NodeSlot
    {
        public int SlotNumber { get; set; }
        public double Capacity { get; set; }
        public bool IsAvailable { get; set; } = true;

        /// <summary>
        /// Price paid to the Prosumer per kWh actually delivered through this slot (Rs/kWh).
        /// Captured on the Reservation at booking time so later price changes don't affect
        /// reservations already in flight.
        /// </summary>
        public double UnitPricePerKwh { get; set; }
    }

    public class Node
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Capacity { get; set; }
        public int NumberOfSlots { get; set; }
        public List<NodeSlot> Slots { get; set; } = new();

        /// <summary>
        /// Daily operating hours, e.g. "08:00" / "20:00" - editable independently of slots/capacity.
        /// </summary>
        public string? OpeningTime { get; set; }
        public string? ClosingTime { get; set; }

        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}
