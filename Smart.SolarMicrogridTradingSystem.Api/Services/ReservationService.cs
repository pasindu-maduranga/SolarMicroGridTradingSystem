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

                var scheduleError = ValidateSchedulingWindow(request.ScheduledDate);
                if (scheduleError != null)
                {
                    return responseFactory.Error(scheduleError);
                }

                // Two Prosumers can't physically occupy the same slot at the same time - this is
                // separate from (and checked before) the shared daily capacity pool below, which
                // governs total energy through the slot across the whole day, not who can be
                // plugged in at a given instant.
                if (await HasTimeConflictAsync(node.Id!, slot.SlotNumber, request.ScheduledDate))
                {
                    return responseFactory.Error($"Slot #{slot.SlotNumber} is already booked at that time. Please pick a different time.");
                }

                // A slot's capacity is a shared pool for a given day, not a single exclusive
                // claim - any number of Prosumers can book it for the same date (at different
                // times) as long as the hub's cumulative *actual, verified* delivery for that
                // slot/date hasn't used it all up yet. Nothing is deducted at booking time (see
                // VerifyReservationAsync) - only once a Grid Operator records a real meter reading.
                var remaining = await GetRemainingCapacityAsync(node.Id!, slot.SlotNumber, request.ScheduledDate, slot.Capacity);
                if (remaining <= 0)
                {
                    return responseFactory.Error($"Slot #{slot.SlotNumber} is fully booked for {request.ScheduledDate:dd MMM yyyy}. Please choose another date or slot.");
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

                // This is the point capacity actually gets used up for the slot - checked against
                // *today* (when this verification is actually happening), not the originally
                // scheduled date, since that's the real-world date this delivery counts against.
                var today = DateTime.UtcNow.Date;
                var remaining = await GetRemainingCapacityAsync(reservation.NodeId, reservation.SlotNumber, today, reservation.SlotCapacity, excludeReservationId: reservation.Id);
                if (request.EnergyDeliveredKwh > remaining)
                {
                    return responseFactory.Error($"This would exceed Slot #{reservation.SlotNumber}'s remaining capacity for today ({remaining:0.##} kWh left). Please confirm the reading or contact Backoffice.");
                }

                reservation.EnergyDeliveredKwh = request.EnergyDeliveredKwh;
                reservation.AmountEarned = Math.Round(request.EnergyDeliveredKwh * reservation.UnitPricePerKwh, 2);
                reservation.Status = ReservationStatus.Completed;
                reservation.CompletedDate = DateTime.UtcNow;
                reservation.VerifiedBy = request.VerifiedBy;

                await reservations.ReplaceOneAsync(x => x.Id == reservation.Id, reservation);

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

                    if (await HasTimeConflictAsync(node.Id!, newSlot.SlotNumber, request.NewScheduledDate, excludeReservationId: reservation.Id))
                    {
                        return responseFactory.Error($"Slot #{newSlot.SlotNumber} is already booked at that time. Please pick a different time.");
                    }

                    var remaining = await GetRemainingCapacityAsync(node.Id!, newSlot.SlotNumber, request.NewScheduledDate, newSlot.Capacity);
                    if (remaining <= 0)
                    {
                        return responseFactory.Error($"Slot #{newSlot.SlotNumber} is fully booked for {request.NewScheduledDate:dd MMM yyyy}. Please choose another date or slot.");
                    }

                    reservation.SlotNumber = newSlot.SlotNumber;
                    reservation.SlotCapacity = newSlot.Capacity;
                    reservation.UnitPricePerKwh = newSlot.UnitPricePerKwh;
                }
                else
                {
                    if (await HasTimeConflictAsync(reservation.NodeId, reservation.SlotNumber, request.NewScheduledDate, excludeReservationId: reservation.Id))
                    {
                        return responseFactory.Error($"Slot #{reservation.SlotNumber} is already booked at that time. Please pick a different time.");
                    }

                    var remaining = await GetRemainingCapacityAsync(reservation.NodeId, reservation.SlotNumber, request.NewScheduledDate, reservation.SlotCapacity, excludeReservationId: reservation.Id);
                    if (remaining <= 0)
                    {
                        return responseFactory.Error($"Slot #{reservation.SlotNumber} is fully booked for {request.NewScheduledDate:dd MMM yyyy}. Please choose another date or slot.");
                    }
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

        /// <summary>True if this slot already has another non-cancelled booking within the same
        /// clock hour as the requested time - two Prosumers can't physically be plugged into the
        /// same slot at once, regardless of how much of the day's shared energy capacity is still
        /// free. Matches the mobile/web booking UI's hourly time-slot granularity.</summary>
        private async Task<bool> HasTimeConflictAsync(string nodeId, int slotNumber, DateTime scheduledDate, string? excludeReservationId = null)
        {
            var hourStart = new DateTime(scheduledDate.Year, scheduledDate.Month, scheduledDate.Day, scheduledDate.Hour, 0, 0, DateTimeKind.Utc);
            var hourEnd = hourStart.AddHours(1);
            var filter = Builders<Reservation>.Filter.Where(r =>
                r.NodeId == nodeId &&
                r.SlotNumber == slotNumber &&
                r.Status != ReservationStatus.Cancelled &&
                r.ScheduledDate >= hourStart && r.ScheduledDate < hourEnd &&
                r.Id != excludeReservationId);

            return await reservations.Find(filter).AnyAsync();
        }

        /// <summary>How much of a slot's capacity is still free for a given calendar date - the
        /// pool is shared across every Prosumer booking that slot/date, and is only actually
        /// drawn down by *verified* deliveries (Completed reservations), never by a pending
        /// (Active) booking alone. Bucketed by <see cref="Reservation.CompletedDate"/> (when the
        /// energy was actually delivered and recorded), not ScheduledDate - a reservation can be
        /// scheduled for one date but verified on another (e.g. verified early, or scheduled days
        /// in advance), and it's the real delivery date that the capacity pool must reflect.
        /// <paramref name="excludeReservationId"/> lets a reservation being verified/rescheduled
        /// check capacity without being affected by its own not-yet-updated record.</summary>
        private async Task<double> GetRemainingCapacityAsync(string nodeId, int slotNumber, DateTime date, double slotCapacity, string? excludeReservationId = null)
        {
            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1);
            var filter = Builders<Reservation>.Filter.Where(r =>
                r.NodeId == nodeId &&
                r.SlotNumber == slotNumber &&
                r.Status == ReservationStatus.Completed &&
                r.CompletedDate != null &&
                r.CompletedDate >= dayStart && r.CompletedDate < dayEnd &&
                r.Id != excludeReservationId);

            var completed = await reservations.Find(filter).ToListAsync();
            var usedKwh = completed.Sum(r => r.EnergyDeliveredKwh ?? 0);
            return slotCapacity - usedKwh;
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
