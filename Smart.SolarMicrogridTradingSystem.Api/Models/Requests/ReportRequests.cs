/*
 * File: ReportRequests.cs
 * Description: Contains the query filters shared by the Reports module endpoints.
 * Author: Smart Solar Microgrid Trading System Team
 */
using System;

namespace Smart.SolarMicrogridTradingSystem.Api.Models.Requests
{
    /// <summary>
    /// Bound from the query string of every /api/Reporting report endpoint. All fields are
    /// optional - a missing date range defaults to the last 30 days (see ReportingService).
    /// </summary>
    public class ReportFilter
    {
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string? NodeId { get; set; }
        public string? ProsumerNic { get; set; }
        public string? Status { get; set; }

        /// <summary>The browser's offset from UTC (JS getTimezoneOffset, in minutes, sign
        /// inverted to "minutes ahead of UTC") so day/hour buckets match the viewer's clock.</summary>
        public int TzOffsetMinutes { get; set; }
    }
}
