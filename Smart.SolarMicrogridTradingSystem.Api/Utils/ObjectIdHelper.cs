using MongoDB.Bson;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    public static class ObjectIdHelper
    {
        public static bool IsValid(string? value) => !string.IsNullOrWhiteSpace(value) && ObjectId.TryParse(value, out _);

        public static string? NormalizeOrNull(string? value) => IsValid(value) ? value : null;
    }
}
