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
        private readonly IApiResponseFactory responseFactory;

        public NodeService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            nodes = database.GetCollection<Node>("Nodes");
            users = database.GetCollection<User>("Users");
            roles = database.GetCollection<Role>("Roles");
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
                    Slots = GenerateSlots(request.Capacity, request.NumberOfSlots),
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
                    node.Slots = GenerateSlots(request.Capacity, request.NumberOfSlots);
                }

                node.Name = request.Name;
                node.Address = request.Address;
                node.Latitude = request.Latitude;
                node.Longitude = request.Longitude;
                node.Capacity = request.Capacity;
                node.NumberOfSlots = request.NumberOfSlots;
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

        private static List<NodeSlot> GenerateSlots(double capacity, int numberOfSlots)
        {
            if (numberOfSlots <= 0)
            {
                return new List<NodeSlot>();
            }

            var slotCapacity = capacity / numberOfSlots;
            var slots = new List<NodeSlot>();
            for (var i = 1; i <= numberOfSlots; i++)
            {
                slots.Add(new NodeSlot { SlotNumber = i, Capacity = slotCapacity, IsAvailable = true });
            }
            return slots;
        }

        private async Task<object> ToSummaryAsync(Node node)
        {
            var assignedOperator = await users.Find(x => x.AssignedNodeId == node.Id).FirstOrDefaultAsync();
            return new
            {
                nodeID = node.Id,
                name = node.Name,
                address = node.Address,
                latitude = node.Latitude,
                longitude = node.Longitude,
                capacity = node.Capacity,
                numberOfSlots = node.NumberOfSlots,
                availableSlotsCount = node.Slots.Count(s => s.IsAvailable),
                availableCapacity = node.Slots.Where(s => s.IsAvailable).Sum(s => s.Capacity),
                slots = node.Slots.Select(s => new { slotNumber = s.SlotNumber, capacity = s.Capacity, isAvailable = s.IsAvailable }),
                isActive = node.IsActive,
                assignedGridOperatorUserId = assignedOperator?.Id,
                assignedGridOperatorName = assignedOperator != null ? $"{assignedOperator.FirstName} {assignedOperator.LastName}".Trim() : null,
                createdDate = node.CreatedDate
            };
        }
    }
}
