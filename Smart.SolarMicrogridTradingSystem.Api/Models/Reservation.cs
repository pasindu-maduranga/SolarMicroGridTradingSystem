using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public static class ReservationStatus
    {
        public const string Active = "Active";
        public const string Completed = "Completed";
        public const string Cancelled = "Cancelled";
    }

    public class Reservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string NodeId { get; set; } = null!;
        public string NodeName { get; set; } = null!;
        public int SlotNumber { get; set; }
        public double SlotCapacity { get; set; }

        /// <summary>Rs/kWh at the time of booking - frozen here so a later node price change
        /// never affects a reservation already in flight.</summary>
        public double UnitPricePerKwh { get; set; }

        /// <summary>The prosumer-chosen drop-off time - must be within 7 days of booking; editing
        /// or cancelling requires at least 12 hours' notice before this time.</summary>
        public System.DateTime ScheduledDate { get; set; }

        /// <summary>Manually entered by the Grid Operator from the hub's meter reading when the
        /// QR is verified - this, not the slot's rated capacity, is what the Prosumer is paid for.</summary>
        public double? EnergyDeliveredKwh { get; set; }
        public double? AmountEarned { get; set; }

        public string ProsumerNic { get; set; } = null!;
        public string ProsumerName { get; set; } = null!;

        /// <summary>
        /// Unique redemption code encoded into the QR shown on the Prosumer's app;
        /// scanned by a Grid Operator at the physical hub to complete the reservation.
        /// </summary>
        public string QrToken { get; set; } = Guid.NewGuid().ToString("N");

        public string Status { get; set; } = ReservationStatus.Active;

        public DateTime ReservedDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedDate { get; set; }
        public DateTime? CancelledDate { get; set; }
        public string? VerifiedBy { get; set; }
    }
}
