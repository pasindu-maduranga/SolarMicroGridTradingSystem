/*
 * File: NodeController.cs
 * Description: Contains the implementation for NodeController.
 * Author: Smart Solar Microgrid Trading System Team
 */
using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NodeController : ControllerBase
    {
        private readonly INodeService nodeService;
        private readonly IApiResponseFactory responseFactory;
        // Depended on here (controller level only, never from NodeService itself) purely to check
        // for active reservations before a deactivation - avoids a circular service dependency
        // since ReservationService already depends on INodeService.
        private readonly IReservationService reservationService;

        public NodeController(INodeService nodeService, IReservationService reservationService, IApiResponseFactory responseFactory)
        {
            this.nodeService = nodeService;
            this.reservationService = reservationService;
            this.responseFactory = responseFactory;
        }

        [HttpGet]
        // Executes the Get functionality.
        public async Task<ApiResponse> Get()
        {
            return await nodeService.GetAllNodesAsync();
        }

        [HttpGet]
        [Route("{id}")]
        // Executes the GetById functionality.
        public async Task<ApiResponse> GetById(string id)
        {
            return await nodeService.GetNodeByIdAsync(id);
        }

        [HttpGet]
        [Route("available-grid-operators")]
        // Executes the GetAvailableGridOperators functionality.
        public async Task<ApiResponse> GetAvailableGridOperators([FromQuery] string? excludeNodeId)
        {
            return await nodeService.GetAvailableGridOperatorsAsync(excludeNodeId);
        }

        [HttpPost]
        // Executes the Post functionality.
        public async Task<ApiResponse> Post([FromBody] NodeRequest request)
        {
            return await nodeService.CreateNodeAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        // Executes the Put functionality.
        public async Task<ApiResponse> Put(string id, [FromBody] NodeRequest request)
        {
            if (!request.IsActive && await reservationService.HasActiveReservationsForNodeAsync(id))
            {
                return responseFactory.Error("This node cannot be deactivated while it has active energy reservations.");
            }

            return await nodeService.UpdateNodeAsync(id, request);
        }

        [HttpPut]
        [Route("{id}/slot-prices")]
        // Executes the SetSlotPrices functionality.
        public async Task<ApiResponse> SetSlotPrices(string id, [FromBody] SetSlotPricesRequest request)
        {
            return await nodeService.SetSlotPricesAsync(id, request);
        }

        [HttpPut]
        [Route("{id}/assign-operator")]
        // Executes the AssignOperator functionality.
        public async Task<ApiResponse> AssignOperator(string id, [FromBody] AssignGridOperatorRequest request)
        {
            return await nodeService.AssignGridOperatorAsync(id, request.AssignedGridOperatorUserId);
        }

        [HttpDelete]
        [Route("{id}")]
        // Executes the Delete functionality.
        public async Task<ApiResponse> Delete(string id)
        {
            return await nodeService.DeleteNodeAsync(id);
        }
    }
}
