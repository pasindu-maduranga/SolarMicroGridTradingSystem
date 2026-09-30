using System.ComponentModel.DataAnnotations;
using Smart.SolarMicrogridTradingSystem.Api.Utils;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class CreateProsumerRequest
    {
        [Required]
        [SriLankanNic]
        public string NIC { get; set; } = null!;
        
        [Required]
        public string FirstName { get; set; } = null!;
        
        [Required]
        public string LastName { get; set; } = null!;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;
        
        [Required]
        public string Password { get; set; } = null!;
        
        [Required]
        public string PhoneNumber { get; set; } = null!;
        
        [Required]
        public string Address { get; set; } = null!;

        [Range(-90, 90)]
        public double Latitude { get; set; }

        [Range(-180, 180)]
        public double Longitude { get; set; }

        public bool IsActive { get; set; } = true;
        public string? CreatedBy { get; set; }
    }

    public class UpdateProsumerRequest
    {
        [Required]
        public string FirstName { get; set; } = null!;
        
        [Required]
        public string LastName { get; set; } = null!;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;
        
        [Required]
        public string PhoneNumber { get; set; } = null!;
        
        [Required]
        public string Address { get; set; } = null!;

        [Range(-90, 90)]
        public double? Latitude { get; set; }

        [Range(-180, 180)]
        public double? Longitude { get; set; }

        public bool IsActive { get; set; }
        public string? ModifiedBy { get; set; }
    }

    public class ApproveProsumerRequest
    {
        public string? ApprovedBy { get; set; }
    }

    public class RejectProsumerRequest
    {
        [Required]
        public string Reason { get; set; } = null!;
        public string? RejectedBy { get; set; }
    }
}
