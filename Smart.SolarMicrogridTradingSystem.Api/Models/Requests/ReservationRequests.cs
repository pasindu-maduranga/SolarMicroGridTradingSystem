/*
 * File: ReservationRequests.cs
 * Description: Contains the implementation for ReservationRequests.
 * Author: Smart Solar Microgrid Trading System Team
 */
using System;
using System.ComponentModel.DataAnnotations;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class CreateReservationRequest
    {
        [Required]
        public string NodeId { get; set; } = null!;

        [Required]
        public int SlotNumber { get; set; }

        [Required]
        public string ProsumerNic { get; set; } = null!;

        /// <summary>Must be within the next 7 days (and in the future) at the time of booking.</summary>
        [Required]
        public DateTime ScheduledDate { get; set; }
    }

    public class UpdateReservationRequest
    {
        [Required]
        public string ProsumerNic { get; set; } = null!;

        public int? NewSlotNumber { get; set; }

        [Required]
        public DateTime NewScheduledDate { get; set; }
    }

    public class VerifyReservationRequest
    {
        [Required]
        public string QrToken { get; set; } = null!;
        public string? VerifiedBy { get; set; }

        /// <summary>Actual meter reading at the hub for this session (kWh) - manually entered by
        /// the Grid Operator, since this is what the Prosumer is actually paid for.</summary>
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Energy delivered must be greater than 0 kWh.")]
        public double EnergyDeliveredKwh { get; set; }
    }

    public class CancelReservationRequest
    {
        [Required]
        public string ProsumerNic { get; set; } = null!;
    }
}
