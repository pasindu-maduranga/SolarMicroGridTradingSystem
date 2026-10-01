using MongoDB.Bson;
using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using Smart.SolarMicrogridTradingSystem.Api.Utils;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class NodeService : INodeService
    {
        private readonly IMongoCollection<Node> nodes;
        private readonly IMongoCollection<User> users;
        private readonly IMongoCollection<Role> roles;
        private readonly IMongoCollection<Reservation> reservations;
        private readonly IApiResponseFactory responseFactory;

        public NodeService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            nodes = database.GetCollection<Node>("Nodes");
            users = database.GetCollection<User>("Users");
            roles = database.GetCollection<Role>("Roles");
            reservations = database.GetCollection<Reservation>("Reservations");
            this.responseFactory = responseFactory;
        }

        public async Task<ApiResponse> GetAllNodesAsync()
        {
            try
            {
                var result = await nodes.Find(_ => true).ToListAsync();
                var summaries = new List<object>();
                foreach (var node in result)
                {
                    summaries.Add(await ToSummaryAsync(node));
                }
                return responseFactory.Success(string.Empty, summaries);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetNodeByIdAsync(string id)
        {
            try
            {
                var node = await nodes.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (node == null)
                {
                    return responseFactory.Error("Node not found.");
                }
                return responseFactory.Success(string.Empty, await ToSummaryAsync(node));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> CreateNodeAsync(NodeRequest request)
        {
            try
            {
                var node = new Node
                {
                    Name = request.Name,
                    Address = request.Address,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    Capacity = request.Capacity,
                    NumberOfSlots = request.NumberOfSlots,
                    Slots = GenerateSlots(request.Capacity, request.NumberOfSlots, request.DefaultUnitPricePerKwh),
                    OpeningTime = request.OpeningTime,
                    ClosingTime = request.ClosingTime,
                    IsActive = request.IsActive,
                    CreatedBy = request.CreatedBy,
                    CreatedDate = DateTime.UtcNow
                };
                await nodes.InsertOneAsync(node);

                return responseFactory.Success("Node created successfully.", await ToSummaryAsync(node));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> UpdateNodeAsync(string id, NodeRequest request)
        {
            try
            {
                var node = await nodes.Find(x => x.Id == id).FirstOrDefaultAsync();
                if (node == null)
                {
                    return responseFactory.Error("Node not found.");
                }

                // Grid Operator assignment is handled exclusively via AssignGridOperatorAsync
                // (the Grid Operator <-> Node Mapping screen) - intentionally not touched here.

                if (request.NumberOfSlots != node.NumberOfSlots || request.Capacity != node.Capacity)
                {
                    node.Slots = GenerateSlots(request.Capacity, request.NumberOfSlots, request.DefaultUnitPricePerKwh);
                }

                node.Name = request.Name;
                node.Address = request.Address;
                node.Latitude = request.Latitude;
                node.Longitude = request.Longitude;
                node.Capacity = request.Capacity;
                node.NumberOfSlots = request.NumberOfSlots;
                node.OpeningTime = request.OpeningTime;
                node.ClosingTime = request.ClosingTime;
                node.IsActive = request.IsActive;
                node.ModifiedBy = request.ModifiedBy;
                node.ModifiedDate = DateTime.UtcNow;

                await nodes.ReplaceOneAsync(x => x.Id == id, node);
                return responseFactory.Success("Node updated successfully.", await ToSummaryAsync(node));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> SetSlotPricesAsync(string nodeId, SetSlotPricesRequest request)
        {
            try
            {
                var node = await nodes.Find(x => x.Id == nodeId).FirstOrDefaultAsync();
                if (node == null)
                {
                    return responseFactory.Error("Node not found.");
                }

                foreach (var entry in request.Prices)
                {
                    var slot = node.Slots.FirstOrDefault(s => s.SlotNumber == entry.SlotNumber);
                    if (slot != null)
                    {
                        slot.UnitPricePerKwh = entry.UnitPricePerKwh;
                    }
                }

                node.ModifiedBy = request.ModifiedBy;
                node.ModifiedDate = DateTime.UtcNow;

                await nodes.ReplaceOneAsync(x => x.Id == nodeId, node);
                return responseFactory.Success("Slot pricing updated.", await ToSummaryAsync(node));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> DeleteNodeAsync(string id)
        {
            try
            {
                var assignedOperator = await users.Find(x => x.AssignedNodeId == id).FirstOrDefaultAsync();
                if (assignedOperator != null)
                {
                    assignedOperator.AssignedNodeId = null;
                    await users.ReplaceOneAsync(x => x.Id == assignedOperator.Id, assignedOperator);
                }

                await nodes.DeleteOneAsync(x => x.Id == id);
                return responseFactory.Success("Node removed successfully.");
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> GetAvailableGridOperatorsAsync(string? excludeNodeId)
        {
            try
            {
                var gridOperatorRole = await roles.Find(
                    Builders<Role>.Filter.Regex(r => r.RoleName, new BsonRegularExpression("^Grid Operator$", "i"))
                ).FirstOrDefaultAsync();

                if (gridOperatorRole == null)
                {
                    return responseFactory.Success(string.Empty, new List<object>());
                }

                var filter = Builders<User>.Filter.Eq(u => u.RoleId, gridOperatorRole.Id) &
                             Builders<User>.Filter.Eq(u => u.IsActive, true) &
                             (Builders<User>.Filter.Eq(u => u.AssignedNodeId, null) |
                              Builders<User>.Filter.Eq(u => u.AssignedNodeId, excludeNodeId));

                var availableOperators = await users.Find(filter).ToListAsync();
                var summaries = availableOperators.Select(u => new
                {
                    userID = u.Id,
                    name = $"{u.FirstName} {u.LastName}".Trim(),
                    userName = u.UserName
                });

                return responseFactory.Success(string.Empty, summaries);
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        public async Task<ApiResponse> AssignGridOperatorAsync(string nodeId, string? operatorUserId)
        {
            try
            {
                var node = await nodes.Find(x => x.Id == nodeId).FirstOrDefaultAsync();
                if (node == null)
                {
                    return responseFactory.Error("Node not found.");
                }

                var newOperatorId = ObjectIdHelper.NormalizeOrNull(operatorUserId);
                if (newOperatorId != null)
                {
                    var validationError = await ValidateGridOperatorIsAvailableAsync(newOperatorId, nodeId);
                    if (validationError != null)
                    {
                        return responseFactory.Error(validationError);
                    }
                }

                var previousOperator = await users.Find(x => x.AssignedNodeId == nodeId).FirstOrDefaultAsync();
                if (previousOperator != null && previousOperator.Id != newOperatorId)
                {
                    previousOperator.AssignedNodeId = null;
                    await users.ReplaceOneAsync(x => x.Id == previousOperator.Id, previousOperator);
                }
                if (newOperatorId != null && previousOperator?.Id != newOperatorId)
                {
                    await AssignOperatorToNodeAsync(newOperatorId, nodeId);
                }

                return responseFactory.Success("Grid Operator assignment updated successfully.", await ToSummaryAsync(node));
            }
            catch (Exception ex)
            {
                return responseFactory.Error(ex.Message);
            }
        }

        private async Task<string?> ValidateGridOperatorIsAvailableAsync(string operatorId, string? excludeNodeId)
        {
            var user = await users.Find(x => x.Id == operatorId).FirstOrDefaultAsync();
            if (user == null)
            {
                return "Selected Grid Operator was not found.";
            }
            if (!string.IsNullOrEmpty(user.AssignedNodeId) && user.AssignedNodeId != excludeNodeId)
            {
                return "Selected Grid Operator is already assigned to another node.";
            }
            return null;
        }

        private async Task AssignOperatorToNodeAsync(string operatorId, string nodeId)
        {
            var user = await users.Find(x => x.Id == operatorId).FirstOrDefaultAsync();
            if (user == null)
            {
                return;
            }
            user.AssignedNodeId = nodeId;
            await users.ReplaceOneAsync(x => x.Id == operatorId, user);
        }

        public async Task<Node?> GetByIdAsync(string id)
        {
            return await nodes.Find(x => x.Id == id).FirstOrDefaultAsync();
        }

        private static List<NodeSlot> GenerateSlots(double capacity, int numberOfSlots, double defaultUnitPricePerKwh)
        {
            if (numberOfSlots <= 0)
            {
                return new List<NodeSlot>();
            }

            var slotCapacity = capacity / numberOfSlots;
            var slots = new List<NodeSlot>();
            for (var i = 1; i <= numberOfSlots; i++)
            {
                slots.Add(new NodeSlot { SlotNumber = i, Capacity = slotCapacity, IsAvailable = true, UnitPricePerKwh = defaultUnitPricePerKwh });
            }
            return slots;
        }

        /// <summary>A slot's capacity is a shared pool per calendar date (any number of Prosumers
        /// can book the same slot/date - see ReservationService.GetRemainingCapacityAsync), only
        /// actually drawn down once a Grid Operator verifies a real meter reading. This overview
        /// has no date parameter, so it reports *today's* remaining capacity as a representative
        /// snapshot - the authoritative check for whatever date a Prosumer actually picks happens
        /// server-side when they submit the reservation.</summary>
        private async Task<object> ToSummaryAsync(Node node)
        {
            var assignedOperator = await users.Find(x => x.AssignedNodeId == node.Id).FirstOrDefaultAsync();

            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            // Bucketed by CompletedDate (actual delivery), not ScheduledDate - a reservation can
            // be scheduled for one date and verified on another, and it's the real delivery date
            // that today's snapshot needs to reflect.
            var completedToday = await reservations.Find(r =>
                r.NodeId == node.Id &&
                r.Status == ReservationStatus.Completed &&
                r.CompletedDate != null &&
                r.CompletedDate >= today && r.CompletedDate < tomorrow
            ).ToListAsync();
            var usedBySlot = completedToday
                .GroupBy(r => r.SlotNumber)
                .ToDictionary(g => g.Key, g => g.Sum(r => r.EnergyDeliveredKwh ?? 0));

            var slotSummaries = node.Slots.Select(s =>
            {
                var used = usedBySlot.TryGetValue(s.SlotNumber, out var u) ? u : 0;
                var remaining = Math.Max(0, s.Capacity - used);
                return new
                {
                    slotNumber = s.SlotNumber,
                    capacity = s.Capacity,
                    isAvailable = remaining > 0,
                    remainingCapacity = remaining,
                    unitPricePerKwh = s.UnitPricePerKwh
                };
            }).ToList();

            return new
            {
                nodeID = node.Id,
                name = node.Name,
                address = node.Address,
                latitude = node.Latitude,
                longitude = node.Longitude,
                capacity = node.Capacity,
                numberOfSlots = node.NumberOfSlots,
                availableSlotsCount = slotSummaries.Count(s => s.isAvailable),
                availableCapacity = slotSummaries.Sum(s => s.remainingCapacity),
                slots = slotSummaries,
                openingTime = node.OpeningTime,
                closingTime = node.ClosingTime,
                isActive = node.IsActive,
                assignedGridOperatorUserId = assignedOperator?.Id,
                assignedGridOperatorName = assignedOperator != null ? $"{assignedOperator.FirstName} {assignedOperator.LastName}".Trim() : null,
                createdDate = node.CreatedDate
            };
        }
    }
}
