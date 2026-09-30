using MongoDB.Driver;
using Smart.SolarMicrogridTradingSystem.Api.Models;
using Smart.SolarMicrogridTradingSystem.Api.Models.Common;
using Smart.SolarMicrogridTradingSystem.Api.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace Smart.SolarMicrogridTradingSystem.Api.Services
{
    public class ReportingService : IReportingService
    {
        private readonly IMongoCollection<User> users;
        private readonly IMongoCollection<Prosumer> prosumers;
        private readonly IApiResponseFactory responseFactory;

        public ReportingService(IMongoDatabase database, IApiResponseFactory responseFactory)
        {
            users = database.GetCollection<User>("Users");
            prosumers = database.GetCollection<Prosumer>("Prosumers");
            this.responseFactory = responseFactory;
        }

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
    }
}
