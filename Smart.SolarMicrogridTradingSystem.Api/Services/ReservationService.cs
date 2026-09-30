using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IMongoCollection<Reservation> reservations;
        private readonly IMongoCollection<Prosumer> prosumers;
        private readonly INodeService nodeService;
        private readonly IApiResponseFactory responseFactory;

        public ReservationService(IMongoDatabase database, INodeService nodeService, IApiResponseFactory responseFactory)
        {
            reservations = database.GetCollection<Reservation>("Reservations");
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            this.nodeService = nodeService;
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> CreateReservationAsync(CreateReservationRequest request)
        {
            try
            {
                var prosumer = await prosumers.Find(x => x.NIC == request.ProsumerNic).FirstOrDefaultAsync();
                if (prosumer == null)
                {
                    return responseFactory.Error("Prosumer not found.");
                }
                if (prosumer.ApprovalStatus != ProsumerApprovalStatus.Approved || !prosumer.IsActive)
                {
                    return responseFactory.Error("Your account is not yet approved for reservations.");
                }

                var node = await nodeService.GetByIdAsync(request.NodeId);
                if (node == null || !node.IsActive)
                {
                    return responseFactory.Error("Node not found or inactive.");
                }

                var slot = node.Slots.FirstOrDefault(s => s.SlotNumber == request.SlotNumber);
                if (slot == null)
                {
                    return responseFactory.Error("Slot not found.");
                }
                if (!slot.IsAvailable)
                {
                    return responseFactory.Error("This slot has already been reserved. Please pick another one.");
                }

                var scheduleError = ValidateSchedulingWindow(request.ScheduledDate);
                if (scheduleError != null)
                {
                    return responseFactory.Error(scheduleError);
                }

                var reservation = new Reservation
                {
                    NodeId = node.Id!,
                    NodeName = node.Name,
                    SlotNumber = slot.SlotNumber,
                    SlotCapacity = slot.Capacity,
                    UnitPricePerKwh = slot.UnitPricePerKwh,
                    ScheduledDate = request.ScheduledDate,
                    ProsumerNic = prosumer.NIC,
                    ProsumerName = $"{prosumer.FirstName} {prosumer.LastName}".Trim(),
                    Status = ReservationStatus.Active,
                    ReservedDate = DateTime.UtcNow
                };

                var slotLocked = await nodeService.SetSlotAvailabilityAsync(node.Id!, slot.SlotNumber, false);
                if (!slotLocked)
                {
                    return responseFactory.Error("Could not reserve the slot. Please try again.");
                }

                await reservations.InsertOneAsync(reservation);
                return responseFactory.Success("Slot reserved successfully. Show the QR code at the hub.", ToSummary(reservation));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetAllReservationsAsync()
        {
            try
            {
                var result = await reservations.Find(_ => true).SortByDescending(x => x.ReservedDate).ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetReservationsByProsumerAsync(string nic)
        {
            try
            {
                var result = await reservations.Find(x => x.ProsumerNic == nic)
                    .SortByDescending(x => x.ReservedDate)
                    .ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Scoped to a single node - used by the Grid Operator mobile app (Transaction
        /// History / My Bookings) so an operator only ever sees reservations at their own hub.</summary>
        public async Task<ApiResponse> GetReservationsByNodeAsync(string nodeId)
        {
            try
            {
                var result = await reservations.Find(x => x.NodeId == nodeId)
                    .SortByDescending(x => x.ReservedDate)
                    .ToListAsync();
                return responseFactory.Success(string.Empty, result.Select(ToSummary));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> VerifyReservationAsync(VerifyReservationRequest request)
        {
            try
            {
                var reservation = await reservations.Find(x => x.QrToken == request.QrToken).FirstOrDefaultAsync();
                if (reservation == null)
                {
                    return responseFactory.Error("Invalid QR code.");
                }
                if (reservation.Status != ReservationStatus.Active)
                {
                    return responseFactory.Error($"This reservation is already {reservation.Status.ToLower()}.");
                }

                // The actual paid amount comes from the real meter reading the Operator enters here,
                // not from the slot's rated capacity - a Prosumer is only paid for what they deliver.
                reservation.EnergyDeliveredKwh = request.EnergyDeliveredKwh;
                reservation.AmountEarned = Math.Round(request.EnergyDeliveredKwh * reservation.UnitPricePerKwh, 2);
                reservation.Status = ReservationStatus.Completed;
                reservation.CompletedDate = DateTime.UtcNow;
                reservation.VerifiedBy = request.VerifiedBy;

                await reservations.ReplaceOneAsync(x => x.Id == reservation.Id, reservation);
                await nodeService.SetSlotAvailabilityAsync(reservation.NodeId, reservation.SlotNumber, true);

                return responseFactory.Success("Reservation verified and completed.", ToSummary(reservation));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateReservationAsync(string id, UpdateReservationRequest request)
        {
            try
            {
                var reservation = await reservations.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (reservation == null)
                {
                    return responseFactory.Error("Reservation not found.");
                }
                if (reservation.ProsumerNic != request.ProsumerNic)
                {
                    return responseFactory.Error("You can only edit your own reservations.");
                }
                if (reservation.Status != ReservationStatus.Active)
                {
                    return responseFactory.Error($"This reservation is already {reservation.Status.ToLower()}.");
                }

                var noticeError = ValidateNoticePeriod(reservation.ScheduledDate);
                if (noticeError != null)
                {
                    return responseFactory.Error(noticeError);
                }

                var scheduleError = ValidateSchedulingWindow(request.NewScheduledDate);
                if (scheduleError != null)
                {
                    return responseFactory.Error(scheduleError);
                }

                if (request.NewSlotNumber.HasValue && request.NewSlotNumber.Value != reservation.SlotNumber)
                {
                    var node = await nodeService.GetByIdAsync(reservation.NodeId);
                    if (node == null || !node.IsActive)
                    {
                        return responseFactory.Error("Node not found or inactive.");
                    }
                    var newSlot = node.Slots.FirstOrDefault(s => s.SlotNumber == request.NewSlotNumber.Value);
                    if (newSlot == null)
                    {
                        return responseFactory.Error("Slot not found.");
                    }
                    if (!newSlot.IsAvailable)
                    {
                        return responseFactory.Error("This slot has already been reserved. Please pick another one.");
                    }

                    var newSlotLocked = await nodeService.SetSlotAvailabilityAsync(node.Id!, newSlot.SlotNumber, false);
                    if (!newSlotLocked)
                    {
                        return responseFactory.Error("Could not reserve the new slot. Please try again.");
                    }
                    await nodeService.SetSlotAvailabilityAsync(reservation.NodeId, reservation.SlotNumber, true);

                    reservation.SlotNumber = newSlot.SlotNumber;
                    reservation.SlotCapacity = newSlot.Capacity;
                    reservation.UnitPricePerKwh = newSlot.UnitPricePerKwh;
                }

                reservation.ScheduledDate = request.NewScheduledDate;

                await reservations.ReplaceOneAsync(x => x.Id == id, reservation);
                return responseFactory.Success("Reservation updated.", ToSummary(reservation));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> CancelReservationAsync(string id, CancelReservationRequest request)
        {
            try
            {
                var reservation = await reservations.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (reservation == null)
                {
                    return responseFactory.Error("Reservation not found.");
                }
                if (reservation.ProsumerNic != request.ProsumerNic)
                {
                    return responseFactory.Error("You can only cancel your own reservations.");
                }
                if (reservation.Status != ReservationStatus.Active)
                {
                    return responseFactory.Error($"This reservation is already {reservation.Status.ToLower()}.");
                }

                var noticeError = ValidateNoticePeriod(reservation.ScheduledDate);
                if (noticeError != null)
                {
                    return responseFactory.Error(noticeError);
                }

                reservation.Status = ReservationStatus.Cancelled;
                reservation.CancelledDate = DateTime.UtcNow;

                await reservations.ReplaceOneAsync(x => x.Id == id, reservation);
                await nodeService.SetSlotAvailabilityAsync(reservation.NodeId, reservation.SlotNumber, true);

                return responseFactory.Success("Reservation cancelled.", ToSummary(reservation));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<bool> HasActiveReservationsForNodeAsync(string nodeId)
        {
            return await reservations.Find(x => x.NodeId == nodeId && x.Status == ReservationStatus.Active).AnyAsync();
        }

        /// <summary>Energy Slot Reservation Management rule: bookings must be scheduled within the next 7 days.</summary>
        private static string? ValidateSchedulingWindow(DateTime scheduledDate)
        {
            var now = DateTime.UtcNow;
            if (scheduledDate <= now)
            {
                return "The scheduled time must be in the future.";
            }
            if (scheduledDate > now.AddDays(7))
            {
                return "Reservations can only be scheduled up to 7 days in advance.";
            }
            return null;
        }

        /// <summary>Energy Slot Reservation Management rule: updates/cancellations need >= 12 hours' notice.</summary>
        private static string? ValidateNoticePeriod(DateTime scheduledDate)
        {
            if (scheduledDate - DateTime.UtcNow < TimeSpan.FromHours(12))
            {
                return "Changes require at least 12 hours' notice before the scheduled time.";
            }
            return null;
        }

        private static object ToSummary(Reservation reservation) => new
        {
            reservationId = reservation.Id,
            nodeID = reservation.NodeId,
            nodeName = reservation.NodeName,
            slotNumber = reservation.SlotNumber,
            slotCapacity = reservation.SlotCapacity,
            unitPricePerKwh = reservation.UnitPricePerKwh,
            scheduledDate = reservation.ScheduledDate,
            energyDeliveredKwh = reservation.EnergyDeliveredKwh,
            amountEarned = reservation.AmountEarned,
            prosumerNic = reservation.ProsumerNic,
            prosumerName = reservation.ProsumerName,
            qrToken = reservation.QrToken,
            status = reservation.Status,
            reservedDate = reservation.ReservedDate,
            completedDate = reservation.CompletedDate,
            cancelledDate = reservation.CancelledDate
        };
    }
}
