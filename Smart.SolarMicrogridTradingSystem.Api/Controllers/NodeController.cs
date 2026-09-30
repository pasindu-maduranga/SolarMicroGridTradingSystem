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
        public async Task<ApiResponse> Get()
        {
            return await nodeService.GetAllNodesAsync();
        }

        [HttpGet]
        [Route("{id}")]
        public async Task<ApiResponse> GetById(string id)
        {
            return await nodeService.GetNodeByIdAsync(id);
        }

        [HttpGet]
        [Route("available-grid-operators")]
        public async Task<ApiResponse> GetAvailableGridOperators([FromQuery] string? excludeNodeId)
        {
            return await nodeService.GetAvailableGridOperatorsAsync(excludeNodeId);
        }

        [HttpPost]
        public async Task<ApiResponse> Post([FromBody] NodeRequest request)
        {
            return await nodeService.CreateNodeAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
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
        public async Task<ApiResponse> SetSlotPrices(string id, [FromBody] SetSlotPricesRequest request)
        {
            return await nodeService.SetSlotPricesAsync(id, request);
        }

        [HttpPut]
        [Route("{id}/assign-operator")]
        public async Task<ApiResponse> AssignOperator(string id, [FromBody] AssignGridOperatorRequest request)
        {
            return await nodeService.AssignGridOperatorAsync(id, request.AssignedGridOperatorUserId);
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<ApiResponse> Delete(string id)
        {
            return await nodeService.DeleteNodeAsync(id);
        }
    }
}
