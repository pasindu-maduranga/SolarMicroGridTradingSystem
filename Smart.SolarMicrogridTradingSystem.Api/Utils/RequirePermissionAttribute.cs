using Microsoft.AspNetCore.Mvc;
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    // Custom attribute to decorate controllers or actions with required permissions
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(string screenCode, string actionType) 
            : base(typeof(Filters.PermissionAuthorizationFilter))
        {
            Arguments = new object[] { screenCode, actionType };
        }
    }
}
