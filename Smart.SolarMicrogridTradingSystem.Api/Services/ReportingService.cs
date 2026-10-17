/*
 * File: ReportingService.cs
 * Description: Contains the implementation for ReportingService - dashboard statistics and the
 *              data behind every screen of the web Reports module (Trading, Node, Reservation
 *              and Admin reports).
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ReportingService : IReportingService
    {
        private readonly IMongoCollection<User> users;
        private readonly IMongoCollection<Prosumer> prosumers;
        private readonly IMongoCollection<Reservation> reservations;
        private readonly IMongoCollection<Node> nodes;
        private readonly IApiResponseFactory responseFactory;

        public ReportingService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            users = database.GetCollection<User>("Users");
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            reservations = database.GetCollection<Reservation>("Reservations");
            nodes = database.GetCollection<Node>("Nodes");
            this.responseFactory = responseFactory;
        }

        // Executes the GetUserStatisticsAsync functionality.
        public async Task<ApiResponse> GetUserStatisticsAsync()
        {
            try
            {
                var totalUsers = await users.CountDocumentsAsync(_ => true);
                var activeUsers = await users.CountDocumentsAsync(u => u.IsActive);

                return responseFactory.Success(string.Empty, new
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    InactiveUsers = totalUsers - activeUsers
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // Executes the GetProsumerStatisticsAsync functionality.
        public async Task<ApiResponse> GetProsumerStatisticsAsync()
        {
            try
            {
                var totalProsumers = await prosumers.CountDocumentsAsync(_ => true);
                var activeProsumers = await prosumers.CountDocumentsAsync(p => p.IsActive);

                return responseFactory.Success(string.Empty, new
                {
                    TotalProsumers = totalProsumers,
                    ActiveProsumers = activeProsumers,
                    InactiveProsumers = totalProsumers - activeProsumers
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Everything the web Dashboard tiles and Energy chart need in one call: prosumer
        /// counts, today's reservations, pending approvals, overdue reservations and the energy
        /// delivered through the hubs per day over the last <paramref name="days"/> days.
        /// "Today" and the daily buckets use the viewer's local clock (tzOffsetMinutes).</summary>
        public async Task<ApiResponse> GetDashboardSummaryAsync(int tzOffsetMinutes, int days = 14)
        {
            try
            {
                days = Math.Clamp(days, 1, 90);
                var nowUtc = DateTime.UtcNow;
                var todayLocal = nowUtc.AddMinutes(tzOffsetMinutes).Date;
                var todayStartUtc = DateTime.SpecifyKind(todayLocal.AddMinutes(-tzOffsetMinutes), DateTimeKind.Utc);
                var todayEndUtc = todayStartUtc.AddDays(1);
                var seriesStartUtc = todayStartUtc.AddDays(-(days - 1));

                var totalProsumers = await prosumers.CountDocumentsAsync(_ => true);
                var approvedProsumers = await prosumers.CountDocumentsAsync(p => p.ApprovalStatus == ProsumerApprovalStatus.Approved && p.IsActive);
                var pendingApprovals = await prosumers.CountDocumentsAsync(p => p.ApprovalStatus == ProsumerApprovalStatus.Pending);

                var today = await reservations
                    .Find(r => r.ScheduledDate >= todayStartUtc && r.ScheduledDate < todayEndUtc && r.Status != ReservationStatus.Cancelled)
                    .ToListAsync();
                var overdue = await reservations.CountDocumentsAsync(r => r.Status == ReservationStatus.Active && r.ScheduledDate < nowUtc);

                var completed = await reservations
                    .Find(r => r.Status == ReservationStatus.Completed && r.CompletedDate >= seriesStartUtc && r.CompletedDate < todayEndUtc)
                    .ToListAsync();
                var byDay = completed
                    .GroupBy(r => DateTime.SpecifyKind(r.CompletedDate!.Value, DateTimeKind.Utc).AddMinutes(tzOffsetMinutes).Date)
                    .ToDictionary(g => g.Key, g => g.ToList());
                var series = Enumerable.Range(0, days)
                    .Select(i =>
                    {
                        var day = todayLocal.AddDays(i - (days - 1));
                        byDay.TryGetValue(day, out var list);
                        list ??= new List<Reservation>();
                        return new
                        {
                            Date = day.ToString("yyyy-MM-dd"),
                            Label = day.ToString("dd MMM"),
                            EnergyKwh = Round(list.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                            Trades = list.Count
                        };
                    })
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    TotalProsumers = totalProsumers,
                    RegisteredProsumers = approvedProsumers,
                    PendingApprovals = pendingApprovals,
                    TodaysReservations = today.Count,
                    TodaysCompleted = today.Count(r => r.Status == ReservationStatus.Completed),
                    OverdueReservations = overdue,
                    Energy = new
                    {
                        Days = days,
                        TotalKwh = Round(completed.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        TodayKwh = series.Last().EnergyKwh,
                        Trades = completed.Count,
                        Series = series
                    }
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Latest events across the microgrid for the Dashboard's Recent Activity feed:
        /// reservations booked / verified / cancelled, Prosumer registrations and approval
        /// decisions, and newly added nodes - merged and sorted newest first.</summary>
        public async Task<ApiResponse> GetRecentActivityAsync(int limit = 8)
        {
            try
            {
                limit = Math.Clamp(limit, 1, 50);
                var staff = (await users.Find(_ => true).ToListAsync()).Where(u => u.Id != null).ToList();
                string StaffName(string? idOrUserName)
                {
                    if (string.IsNullOrWhiteSpace(idOrUserName)) return "staff";
                    var user = staff.FirstOrDefault(u => u.Id == idOrUserName || string.Equals(u.UserName, idOrUserName, StringComparison.OrdinalIgnoreCase));
                    return user != null ? $"{user.FirstName} {user.LastName}".Trim() : idOrUserName;
                }

                var events = new List<ActivityEvent>();

                var booked = await reservations.Find(_ => true).SortByDescending(r => r.ReservedDate).Limit(limit).ToListAsync();
                events.AddRange(booked.Select(r => new ActivityEvent(
                    "booked", r.ReservedDate,
                    $"{r.ProsumerName} booked Slot #{r.SlotNumber}",
                    r.NodeName,
                    r.ScheduledDate)));

                var verified = await reservations.Find(r => r.Status == ReservationStatus.Completed && r.CompletedDate != null)
                    .SortByDescending(r => r.CompletedDate).Limit(limit).ToListAsync();
                events.AddRange(verified.Select(r => new ActivityEvent(
                    "verified", r.CompletedDate!.Value,
                    $"{Round(r.EnergyDeliveredKwh ?? 0):0.##} kWh delivered by {r.ProsumerName}",
                    $"{r.NodeName} · verified by {StaffName(r.VerifiedBy)} · Rs. {Round(r.AmountEarned ?? 0):N2}")));

                var cancelled = await reservations.Find(r => r.Status == ReservationStatus.Cancelled && r.CancelledDate != null)
                    .SortByDescending(r => r.CancelledDate).Limit(limit).ToListAsync();
                events.AddRange(cancelled.Select(r => new ActivityEvent(
                    "cancelled", r.CancelledDate!.Value,
                    $"{r.ProsumerName} cancelled a reservation",
                    $"{r.NodeName} · Slot #{r.SlotNumber}")));

                var registered = await prosumers.Find(_ => true).SortByDescending(p => p.CreatedDate).Limit(limit).ToListAsync();
                events.AddRange(registered.Select(p => new ActivityEvent(
                    "registered", p.CreatedDate,
                    $"{p.FirstName} {p.LastName}".Trim() + " registered as a Prosumer",
                    p.ApprovalStatus == ProsumerApprovalStatus.Pending ? "Awaiting approval" : $"NIC {p.NIC}")));

                var decided = await prosumers.Find(p => p.ApprovedDate != null && p.ApprovalStatus != ProsumerApprovalStatus.Pending)
                    .SortByDescending(p => p.ApprovedDate).Limit(limit).ToListAsync();
                events.AddRange(decided.Select(p =>
                {
                    var approved = p.ApprovalStatus == ProsumerApprovalStatus.Approved;
                    var name = $"{p.FirstName} {p.LastName}".Trim();
                    return new ActivityEvent(
                        approved ? "approved" : "rejected", p.ApprovedDate!.Value,
                        approved ? $"{name} was approved" : $"{name} was rejected",
                        approved
                            ? $"by {StaffName(p.ApprovedBy)}"
                            : $"by {StaffName(p.ApprovedBy)}" + (string.IsNullOrWhiteSpace(p.RejectionReason) ? "" : $" · {p.RejectionReason}"));
                }));

                var newNodes = await nodes.Find(_ => true).SortByDescending(n => n.CreatedDate).Limit(limit).ToListAsync();
                events.AddRange(newNodes.Select(n => new ActivityEvent(
                    "node", n.CreatedDate,
                    $"New node added: {n.Name}",
                    $"{n.NumberOfSlots} slots · {n.Capacity:N0} kWh capacity")));

                var feed = events
                    .OrderByDescending(e => e.Timestamp)
                    .Take(limit)
                    .Select(e => new
                    {
                        e.Type,
                        Timestamp = DateTime.SpecifyKind(e.Timestamp, DateTimeKind.Utc),
                        e.Title,
                        e.Detail,
                        // Formatted in the viewer's local time by the web app.
                        ScheduledDate = e.ScheduledDate.HasValue ? DateTime.SpecifyKind(e.ScheduledDate.Value, DateTimeKind.Utc) : (DateTime?)null
                    })
                    .ToList();

                return responseFactory.Success(string.Empty, feed);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        private sealed record ActivityEvent(string Type, DateTime Timestamp, string Title, string Detail, DateTime? ScheduledDate = null);

        // ------------------------------------------------------------------
        // Trading Reports
        // ------------------------------------------------------------------

        /// <summary>Energy Trading Summary - completed (verified) trades bucketed by the day they
        /// were delivered, or by month once the range is longer than ~2 months.</summary>
        public async Task<ApiResponse> GetTradingSummaryAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var completed = await GetCompletedAsync(range, filter.NodeId);
                var monthly = (range.ToUtc - range.FromUtc).TotalDays > 62;

                var rows = completed
                    .GroupBy(r => Bucket(range.ToLocal(r.CompletedDate!.Value), monthly))
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        Period = g.Key.ToString(monthly ? "MMM yyyy" : "dd MMM yyyy"),
                        Trades = g.Count(),
                        EnergyKwh = Round(g.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        Amount = Round(g.Sum(r => r.AmountEarned ?? 0)),
                        AvgPricePerKwh = AvgPrice(g)
                    })
                    .ToList();

                var byNode = completed
                    .GroupBy(r => r.NodeName)
                    .Select(g => new { NodeName = g.Key, EnergyKwh = Round(g.Sum(r => r.EnergyDeliveredKwh ?? 0)) })
                    .OrderByDescending(x => x.EnergyKwh)
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        TotalTrades = completed.Count,
                        TotalEnergyKwh = Round(completed.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        TotalAmount = Round(completed.Sum(r => r.AmountEarned ?? 0)),
                        AvgPricePerKwh = AvgPrice(completed),
                        ActiveProsumers = completed.Select(r => r.ProsumerNic).Distinct().Count()
                    },
                    Grouping = monthly ? "Monthly" : "Daily",
                    Rows = rows,
                    ByNode = byNode
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Prosumer Earnings - one row per Prosumer; when a single Prosumer is selected
        /// the individual trades are returned too so the page can print a statement.</summary>
        public async Task<ApiResponse> GetProsumerEarningsAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var completed = await GetCompletedAsync(range, filter.NodeId);
                if (!string.IsNullOrWhiteSpace(filter.ProsumerNic))
                {
                    completed = completed.Where(r => r.ProsumerNic == filter.ProsumerNic).ToList();
                }

                var rows = completed
                    .GroupBy(r => new { r.ProsumerNic, r.ProsumerName })
                    .Select(g => new
                    {
                        g.Key.ProsumerNic,
                        g.Key.ProsumerName,
                        Trades = g.Count(),
                        EnergyKwh = Round(g.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        Amount = Round(g.Sum(r => r.AmountEarned ?? 0)),
                        AvgPricePerKwh = AvgPrice(g),
                        LastTradeDate = g.Max(r => r.CompletedDate)
                    })
                    .OrderByDescending(x => x.Amount)
                    .ToList();

                var transactions = string.IsNullOrWhiteSpace(filter.ProsumerNic)
                    ? null
                    : completed
                        .OrderBy(r => r.CompletedDate)
                        .Select(r => new
                        {
                            r.CompletedDate,
                            r.NodeName,
                            r.SlotNumber,
                            EnergyKwh = Round(r.EnergyDeliveredKwh ?? 0),
                            r.UnitPricePerKwh,
                            Amount = Round(r.AmountEarned ?? 0),
                            r.VerifiedBy
                        })
                        .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Prosumers = rows.Count,
                        TotalTrades = completed.Count,
                        TotalEnergyKwh = Round(completed.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        TotalAmount = Round(completed.Sum(r => r.AmountEarned ?? 0))
                    },
                    Rows = rows,
                    Transactions = transactions
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // ------------------------------------------------------------------
        // Node Reports
        // ------------------------------------------------------------------

        /// <summary>Node Performance - every node (including ones with no bookings) with its
        /// booking outcome mix and the energy/payout actually recorded at it.</summary>
        public async Task<ApiResponse> GetNodePerformanceAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var allNodes = await GetNodesAsync(filter.NodeId);
                var booked = await GetBookedAsync(range, filter.NodeId);

                var rows = allNodes
                    .Select(n =>
                    {
                        var list = booked.Where(r => r.NodeId == n.Id).ToList();
                        var completed = list.Where(r => r.Status == ReservationStatus.Completed).ToList();
                        var cancelled = list.Count(r => r.Status == ReservationStatus.Cancelled);
                        return new
                        {
                            NodeName = n.Name,
                            n.Address,
                            IsActive = n.IsActive,
                            Slots = n.Slots.Count,
                            CapacityKwh = Round(n.Capacity),
                            Bookings = list.Count,
                            Completed = completed.Count,
                            Cancelled = cancelled,
                            Active = list.Count(r => r.Status == ReservationStatus.Active),
                            CompletionRate = Percent(completed.Count, list.Count),
                            CancellationRate = Percent(cancelled, list.Count),
                            EnergyKwh = Round(completed.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                            Payout = Round(completed.Sum(r => r.AmountEarned ?? 0))
                        };
                    })
                    .OrderByDescending(x => x.EnergyKwh)
                    .ThenByDescending(x => x.Bookings)
                    .ToList();

                var completedAll = booked.Where(r => r.Status == ReservationStatus.Completed).ToList();
                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Nodes = allNodes.Count,
                        ActiveNodes = allNodes.Count(n => n.IsActive),
                        TotalBookings = booked.Count,
                        TotalEnergyKwh = Round(completedAll.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                        TotalPayout = Round(completedAll.Sum(r => r.AmountEarned ?? 0)),
                        CompletionRate = Percent(completedAll.Count, booked.Count)
                    },
                    Rows = rows
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Slot Utilization - per node/slot usage against the slot's daily capacity pool
        /// over the selected range, plus a weekday x hour heatmap of when bookings are scheduled.</summary>
        public async Task<ApiResponse> GetSlotUtilizationAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var allNodes = await GetNodesAsync(filter.NodeId);
                var booked = (await GetBookedAsync(range, filter.NodeId))
                    .Where(r => r.Status != ReservationStatus.Cancelled)
                    .ToList();
                var days = Math.Max(1, (int)Math.Round((range.ToUtc - range.FromUtc).TotalDays));

                var rows = allNodes
                    .SelectMany(n => n.Slots.Select(s =>
                    {
                        var list = booked.Where(r => r.NodeId == n.Id && r.SlotNumber == s.SlotNumber).ToList();
                        var delivered = list.Where(r => r.Status == ReservationStatus.Completed).Sum(r => r.EnergyDeliveredKwh ?? 0);
                        return new
                        {
                            NodeName = n.Name,
                            s.SlotNumber,
                            CapacityKwh = Round(s.Capacity),
                            s.UnitPricePerKwh,
                            Bookings = list.Count,
                            Completed = list.Count(r => r.Status == ReservationStatus.Completed),
                            DeliveredKwh = Round(delivered),
                            Utilization = s.Capacity > 0 ? Round(delivered / (s.Capacity * days) * 100) : 0
                        };
                    }))
                    .OrderBy(x => x.NodeName)
                    .ThenBy(x => x.SlotNumber)
                    .ToList();

                // [weekday 0=Mon..6=Sun][hour 0..23]
                var heatmap = new int[7, 24];
                foreach (var r in booked)
                {
                    var local = range.ToLocal(r.ScheduledDate);
                    var dow = ((int)local.DayOfWeek + 6) % 7;
                    heatmap[dow, local.Hour]++;
                }
                var heatmapRows = Enumerable.Range(0, 7)
                    .Select(d => Enumerable.Range(0, 24).Select(h => heatmap[d, h]).ToArray())
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Slots = rows.Count,
                        IdleSlots = rows.Count(x => x.Bookings == 0),
                        TotalBookings = booked.Count,
                        AvgUtilization = rows.Count > 0 ? Round(rows.Average(x => x.Utilization)) : 0,
                        Days = days
                    },
                    Rows = rows,
                    Heatmap = heatmapRows
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Delivered vs Booked - the slot capacity a Prosumer booked against what the
        /// Grid Operator actually metered at the hub, per completed reservation and per node.</summary>
        public async Task<ApiResponse> GetDeliveredVsBookedAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var completed = await GetCompletedAsync(range, filter.NodeId);

                var rows = completed
                    .OrderByDescending(r => r.CompletedDate)
                    .Select(r =>
                    {
                        var delivered = r.EnergyDeliveredKwh ?? 0;
                        return new
                        {
                            r.CompletedDate,
                            r.NodeName,
                            r.SlotNumber,
                            r.ProsumerName,
                            r.ProsumerNic,
                            BookedKwh = Round(r.SlotCapacity),
                            DeliveredKwh = Round(delivered),
                            VarianceKwh = Round(delivered - r.SlotCapacity),
                            DeliveryRate = r.SlotCapacity > 0 ? Round(delivered / r.SlotCapacity * 100) : 0
                        };
                    })
                    .ToList();

                var byNode = completed
                    .GroupBy(r => r.NodeName)
                    .Select(g => new
                    {
                        NodeName = g.Key,
                        BookedKwh = Round(g.Sum(r => r.SlotCapacity)),
                        DeliveredKwh = Round(g.Sum(r => r.EnergyDeliveredKwh ?? 0))
                    })
                    .OrderBy(x => x.NodeName)
                    .ToList();

                var totalBooked = completed.Sum(r => r.SlotCapacity);
                var totalDelivered = completed.Sum(r => r.EnergyDeliveredKwh ?? 0);
                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Reservations = completed.Count,
                        TotalBookedKwh = Round(totalBooked),
                        TotalDeliveredKwh = Round(totalDelivered),
                        DeliveryRate = totalBooked > 0 ? Round(totalDelivered / totalBooked * 100) : 0,
                        UnderDelivered = rows.Count(x => x.VarianceKwh < 0)
                    },
                    Rows = rows,
                    ByNode = byNode
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // ------------------------------------------------------------------
        // Reservation Reports
        // ------------------------------------------------------------------

        /// <summary>Reservation Status - outcome mix and daily trend of reservations made in the
        /// range, flagging Active ones whose scheduled time has already passed (never verified).</summary>
        public async Task<ApiResponse> GetReservationStatusAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var booked = await GetBookedAsync(range, filter.NodeId);
                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    booked = booked.Where(r => r.Status == filter.Status).ToList();
                }

                var now = DateTime.UtcNow;
                var rows = booked
                    .OrderByDescending(r => r.ReservedDate)
                    .Select(r => new
                    {
                        r.ReservedDate,
                        r.ScheduledDate,
                        r.NodeName,
                        r.SlotNumber,
                        r.ProsumerName,
                        r.ProsumerNic,
                        r.Status,
                        IsOverdue = r.Status == ReservationStatus.Active && r.ScheduledDate < now,
                        EnergyKwh = r.EnergyDeliveredKwh,
                        Amount = r.AmountEarned
                    })
                    .ToList();

                var trend = booked
                    .GroupBy(r => range.ToLocal(r.ReservedDate).Date)
                    .OrderBy(g => g.Key)
                    .Select(g => new
                    {
                        Day = g.Key.ToString("dd MMM"),
                        Active = g.Count(r => r.Status == ReservationStatus.Active),
                        Completed = g.Count(r => r.Status == ReservationStatus.Completed),
                        Cancelled = g.Count(r => r.Status == ReservationStatus.Cancelled)
                    })
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Total = booked.Count,
                        Active = booked.Count(r => r.Status == ReservationStatus.Active),
                        Completed = booked.Count(r => r.Status == ReservationStatus.Completed),
                        Cancelled = booked.Count(r => r.Status == ReservationStatus.Cancelled),
                        Overdue = rows.Count(x => x.IsOverdue)
                    },
                    Rows = rows,
                    Trend = trend
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // ------------------------------------------------------------------
        // Admin Reports
        // ------------------------------------------------------------------

        /// <summary>Grid Operator Activity - verifications recorded by each operator (matched on
        /// the username the mobile app stamps into Reservation.VerifiedBy).</summary>
        public async Task<ApiResponse> GetOperatorActivityAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var completed = await GetCompletedAsync(range, filter.NodeId);
                var allUsers = await users.Find(_ => true).ToListAsync();
                var allNodes = await nodes.Find(_ => true).ToListAsync();
                var nodeNames = allNodes.Where(n => n.Id != null).ToDictionary(n => n.Id!, n => n.Name);

                // Every operator assigned to a node shows up, even with zero verifications.
                var operatorNames = allUsers
                    .Where(u => !string.IsNullOrEmpty(u.AssignedNodeId) && (string.IsNullOrEmpty(filter.NodeId) || u.AssignedNodeId == filter.NodeId))
                    .Select(u => u.UserName)
                    .Concat(completed.Select(r => r.VerifiedBy ?? "Unknown"))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var rows = operatorNames
                    .Select(name =>
                    {
                        var user = allUsers.FirstOrDefault(u => string.Equals(u.UserName, name, StringComparison.OrdinalIgnoreCase));
                        var list = completed.Where(r => string.Equals(r.VerifiedBy ?? "Unknown", name, StringComparison.OrdinalIgnoreCase)).ToList();
                        return new
                        {
                            OperatorName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : name,
                            UserName = name,
                            AssignedNode = user?.AssignedNodeId != null && nodeNames.TryGetValue(user.AssignedNodeId, out var nodeName) ? nodeName : "—",
                            Verifications = list.Count,
                            EnergyKwh = Round(list.Sum(r => r.EnergyDeliveredKwh ?? 0)),
                            Amount = Round(list.Sum(r => r.AmountEarned ?? 0)),
                            LastVerification = list.Count > 0 ? list.Max(r => r.CompletedDate) : null
                        };
                    })
                    .OrderByDescending(x => x.Verifications)
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Operators = rows.Count,
                        ActiveOperators = rows.Count(x => x.Verifications > 0),
                        TotalVerifications = completed.Count,
                        TotalEnergyKwh = Round(completed.Sum(r => r.EnergyDeliveredKwh ?? 0))
                    },
                    Rows = rows
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        /// <summary>Prosumer Registration &amp; Approval - sign-ups in the range, how they were
        /// decided, how long approval took and why registrations were rejected.</summary>
        public async Task<ApiResponse> GetProsumerRegistrationsAsync(ReportFilter filter)
        {
            try
            {
                var range = ResolveRange(filter);
                var list = await prosumers
                    .Find(p => p.CreatedDate >= range.FromUtc && p.CreatedDate < range.ToUtc)
                    .SortByDescending(p => p.CreatedDate)
                    .ToListAsync();
                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    list = list.Where(p => p.ApprovalStatus == filter.Status).ToList();
                }

                // ApprovedBy holds the approving staff member's user id - show their name instead.
                var staffNames = (await users.Find(_ => true).ToListAsync())
                    .Where(u => u.Id != null)
                    .ToDictionary(u => u.Id!, u => $"{u.FirstName} {u.LastName}".Trim());

                var rows = list.Select(p => new
                {
                    p.NIC,
                    Name = $"{p.FirstName} {p.LastName}".Trim(),
                    p.Email,
                    p.PhoneNumber,
                    p.CreatedDate,
                    p.ApprovalStatus,
                    ApprovedBy = p.ApprovedBy != null && staffNames.TryGetValue(p.ApprovedBy, out var staffName) ? staffName : p.ApprovedBy,
                    p.ApprovedDate,
                    p.RejectionReason,
                    p.IsActive
                }).ToList();

                var monthly = (range.ToUtc - range.FromUtc).TotalDays > 62;
                var trend = list
                    .GroupBy(p => Bucket(range.ToLocal(p.CreatedDate), monthly))
                    .OrderBy(g => g.Key)
                    .Select(g => new { Period = g.Key.ToString(monthly ? "MMM yyyy" : "dd MMM"), Registrations = g.Count() })
                    .ToList();

                var decided = list.Where(p => p.ApprovedDate.HasValue && p.ApprovalStatus == ProsumerApprovalStatus.Approved).ToList();
                var reasons = list
                    .Where(p => p.ApprovalStatus == ProsumerApprovalStatus.Rejected)
                    .GroupBy(p => string.IsNullOrWhiteSpace(p.RejectionReason) ? "Not specified" : p.RejectionReason!.Trim())
                    .Select(g => new { Reason = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .ToList();

                return responseFactory.Success(string.Empty, new
                {
                    Summary = new
                    {
                        Total = list.Count,
                        Pending = list.Count(p => p.ApprovalStatus == ProsumerApprovalStatus.Pending),
                        Approved = list.Count(p => p.ApprovalStatus == ProsumerApprovalStatus.Approved),
                        Rejected = list.Count(p => p.ApprovalStatus == ProsumerApprovalStatus.Rejected),
                        AvgApprovalHours = decided.Count > 0 ? Round(decided.Average(p => (p.ApprovedDate!.Value - p.CreatedDate).TotalHours)) : 0
                    },
                    Rows = rows,
                    Trend = trend,
                    RejectionReasons = reasons
                });
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        // ------------------------------------------------------------------
        // Helpers
        // ------------------------------------------------------------------

        /// <summary>Resolved UTC window for a report. "From"/"To" arrive as calendar dates in the
        /// viewer's local time; "To" is inclusive, so the window ends at the start of the next day.</summary>
        private sealed class ReportRange
        {
            public DateTime FromUtc { get; init; }
            public DateTime ToUtc { get; init; }
            public int OffsetMinutes { get; init; }

            public DateTime ToLocal(DateTime utc) => DateTime.SpecifyKind(utc, DateTimeKind.Utc).AddMinutes(OffsetMinutes);
        }

        // Executes the ResolveRange functionality.
        private static ReportRange ResolveRange(ReportFilter filter)
        {
            var offset = filter.TzOffsetMinutes;
            var todayLocal = DateTime.UtcNow.AddMinutes(offset).Date;
            var toLocal = (filter.To?.Date ?? todayLocal).AddDays(1);
            var fromLocal = filter.From?.Date ?? todayLocal.AddDays(-29);
            if (fromLocal >= toLocal)
            {
                fromLocal = toLocal.AddDays(-1);
            }

            return new ReportRange
            {
                FromUtc = DateTime.SpecifyKind(fromLocal.AddMinutes(-offset), DateTimeKind.Utc),
                ToUtc = DateTime.SpecifyKind(toLocal.AddMinutes(-offset), DateTimeKind.Utc),
                OffsetMinutes = offset
            };
        }

        // Completed reservations whose energy was delivered (verified) inside the range.
        private async Task<List<Reservation>> GetCompletedAsync(ReportRange range, string? nodeId)
        {
            var builder = Builders<Reservation>.Filter;
            var filter = builder.Eq(r => r.Status, ReservationStatus.Completed)
                & builder.Gte(r => r.CompletedDate, range.FromUtc)
                & builder.Lt(r => r.CompletedDate, range.ToUtc);
            if (!string.IsNullOrWhiteSpace(nodeId))
            {
                filter &= builder.Eq(r => r.NodeId, nodeId);
            }
            return await reservations.Find(filter).ToListAsync();
        }

        // Reservations of any status that were booked inside the range.
        private async Task<List<Reservation>> GetBookedAsync(ReportRange range, string? nodeId)
        {
            var builder = Builders<Reservation>.Filter;
            var filter = builder.Gte(r => r.ReservedDate, range.FromUtc) & builder.Lt(r => r.ReservedDate, range.ToUtc);
            if (!string.IsNullOrWhiteSpace(nodeId))
            {
                filter &= builder.Eq(r => r.NodeId, nodeId);
            }
            return await reservations.Find(filter).ToListAsync();
        }

        // Executes the GetNodesAsync functionality.
        private async Task<List<Node>> GetNodesAsync(string? nodeId)
        {
            return string.IsNullOrWhiteSpace(nodeId)
                ? await nodes.Find(_ => true).SortBy(n => n.Name).ToListAsync()
                : await nodes.Find(n => n.Id == nodeId).ToListAsync();
        }

        private static DateTime Bucket(DateTime local, bool monthly) =>
            monthly ? new DateTime(local.Year, local.Month, 1) : local.Date;

        private static double Round(double value) => Math.Round(value, 2);

        private static double Percent(int part, int whole) => whole == 0 ? 0 : Math.Round(part * 100.0 / whole, 1);

        // Energy-weighted average price, so a large delivery counts more than a tiny one.
        private static double AvgPrice(IEnumerable<Reservation> list)
        {
            var kwh = list.Sum(r => r.EnergyDeliveredKwh ?? 0);
            return kwh > 0 ? Round(list.Sum(r => r.AmountEarned ?? 0) / kwh) : 0;
        }
    }
}
