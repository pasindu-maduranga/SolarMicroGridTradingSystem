/*
 * File: LoginDto.cs
 * Description: Contains the implementation for LoginDto.
 * Author: Smart Solar Microgrid Trading System Team
 */
namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public class LoginDto
    {
        public string UserName { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
