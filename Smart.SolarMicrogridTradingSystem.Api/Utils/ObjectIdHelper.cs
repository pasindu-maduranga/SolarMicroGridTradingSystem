/*
 * File: ObjectIdHelper.cs
 * Description: Contains the implementation for ObjectIdHelper.
 * Author: Smart Solar Microgrid Trading System Team
 */
using MongoDB.Bson;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    public static class ObjectIdHelper
    {
        // Executes the IsValid functionality.
        public static bool IsValid(string? value) => !string.IsNullOrWhiteSpace(value) && ObjectId.TryParse(value, out _);

        public static string? NormalizeOrNull(string? value) => IsValid(value) ? value : null;
    }
}
