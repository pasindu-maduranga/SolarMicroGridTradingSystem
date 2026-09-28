using System.ComponentModel.DataAnnotations;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    public class CreateProsumerRequest
    {
        [Required]
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

        public bool IsActive { get; set; }
        public string? ModifiedBy { get; set; }
    }
}
