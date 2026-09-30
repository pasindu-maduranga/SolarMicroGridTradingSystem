using Microsoft.AspNetCore.Mvc;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Models.Requests;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService reservationService;

        public ReservationController(IReservationService reservationService)
        {
            this.reservationService = reservationService;
        }

        [HttpPost]
        public async Task<ApiResponse> Post([FromBody] CreateReservationRequest request)
        {
            return await reservationService.CreateReservationAsync(request);
        }

        [HttpGet]
        public async Task<ApiResponse> Get()
        {
            return await reservationService.GetAllReservationsAsync();
        }

        [HttpGet]
        [Route("mine/{nic}")]
        public async Task<ApiResponse> GetMine(string nic)
        {
            return await reservationService.GetReservationsByProsumerAsync(nic);
        }

        [HttpGet]
        [Route("byNode/{nodeId}")]
        public async Task<ApiResponse> GetByNode(string nodeId)
        {
            return await reservationService.GetReservationsByNodeAsync(nodeId);
        }

        [HttpPost]
        [Route("verify")]
        public async Task<ApiResponse> Verify([FromBody] VerifyReservationRequest request)
        {
            return await reservationService.VerifyReservationAsync(request);
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<ApiResponse> Update(string id, [FromBody] UpdateReservationRequest request)
        {
            return await reservationService.UpdateReservationAsync(id, request);
        }

        [HttpPut]
        [Route("{id}/cancel")]
        public async Task<ApiResponse> Cancel(string id, [FromBody] CancelReservationRequest request)
        {
            return await reservationService.CancelReservationAsync(id, request);
        }
    }
}
