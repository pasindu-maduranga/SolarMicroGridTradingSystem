/*
 * File: SriLankanNicAttribute.cs
 * Description: Contains the implementation for SriLankanNicAttribute.
 * Author: Smart Solar Microgrid Trading System Team
 */
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Smart.SolarMicrogridTradingSystem.Api.Utils
{
    /// <summary>
    /// Validates a Sri Lankan NIC: old format (9 digits + V/X, e.g. 903456789V)
    /// or new format (12 digits, e.g. 200345678901). Also checks the embedded
    /// day-of-year is within a valid range (1-366 for males, 501-866 for females).
    /// </summary>
    public class SriLankanNicAttribute : ValidationAttribute
    {
        private static readonly Regex OldFormat = new("^[0-9]{9}[vVxX]$");
        private static readonly Regex NewFormat = new("^[0-9]{12}$");

        protected override ValidationResult? IsValid(object? value, ValidationContext context)
        {
            var nic = value as string;
            if (string.IsNullOrWhiteSpace(nic))
            {
                return new ValidationResult("NIC is required.");
            }

            nic = nic.Trim();

            string dayOfYearPart;
            if (OldFormat.IsMatch(nic))
            {
                dayOfYearPart = nic.Substring(2, 3);
            }
            else if (NewFormat.IsMatch(nic))
            {
                dayOfYearPart = nic.Substring(4, 3);
            }
            else
            {
                return new ValidationResult("Enter a valid Sri Lankan NIC (9 digits + V/X, or 12 digits).");
            }

            var dayOfYear = int.Parse(dayOfYearPart);
            var normalizedDay = dayOfYear > 500 ? dayOfYear - 500 : dayOfYear;
            if (normalizedDay < 1 || normalizedDay > 366)
            {
                return new ValidationResult("NIC does not contain a valid date component.");
            }

            return ValidationResult.Success;
        }
    }
}
