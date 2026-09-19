namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class ParentMenuRequest
    {
        public string ParentMenuName { get; set; } = null!;
        public string IconTag { get; set; } = null!;
        public int MenuOrderNo { get; set; }
    }

    public class MenuRequest
    {
        public string ParentMenuId { get; set; } = null!;
        public string MenuName { get; set; } = null!;
        public string IconTag { get; set; } = null!;
        public int MenuOrderNo { get; set; }
    }

    public class ScreenRequest
    {
        public string MenuId { get; set; } = null!;
        public string ScreenName { get; set; } = null!;
        public string ScreenCode { get; set; } = null!;
        public string IconTag { get; set; } = null!;
        public int ScreenOrderNo { get; set; }
        public string RoutePath { get; set; } = null!;
    }
}
