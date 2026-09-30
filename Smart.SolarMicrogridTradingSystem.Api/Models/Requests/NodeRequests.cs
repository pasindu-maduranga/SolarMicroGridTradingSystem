using System.Collections.Generic;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class NodeRequest
    {
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Capacity { get; set; }
        public int NumberOfSlots { get; set; }

        /// <summary>
        /// Applied to every slot when slots are (re)generated (capacity/count changed, or
        /// this is a new node). Ignored on an update that doesn't change capacity/slot count -
        /// use SlotPriceRequest to re-price existing slots individually or in bulk instead.
        /// </summary>
        public double DefaultUnitPricePerKwh { get; set; }

        public string? OpeningTime { get; set; }
        public string? ClosingTime { get; set; }

        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class AssignGridOperatorRequest
    {
        public string? AssignedGridOperatorUserId { get; set; }
    }

    public class SlotPriceEntry
    {
        public int SlotNumber { get; set; }
        public double UnitPricePerKwh { get; set; }
    }

    /// <summary>
    /// Re-prices one or many slots on a node in a single call - a single entry for one slot,
    /// or several entries to bulk-update prices across a node at once.
    /// </summary>
    public class SetSlotPricesRequest
    {
        public List<SlotPriceEntry> Prices { get; set; } = new();
        public string? ModifiedBy { get; set; }
    }
}
