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

        public NodeController(INodeService nodeService)
        {
            this.nodeService = nodeService;
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
            return await nodeService.UpdateNodeAsync(id, request);
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
