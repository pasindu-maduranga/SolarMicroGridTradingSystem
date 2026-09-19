using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Smart.SolarMicrogridTradingSystem.Api.Models
{
    public static class MenuLevel
    {
        public const int ParentMenu = 0;
        public const int Menu = 1;
        public const int Screen = 2;
    }

    public class Menu
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string Name { get; set; } = null!;
        public string Icon { get; set; } = null!;
        public int Order { get; set; }
        public int Level { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string? ParentId { get; set; }

        public string? Route { get; set; }
        public string? ScreenCode { get; set; }
    }
}
