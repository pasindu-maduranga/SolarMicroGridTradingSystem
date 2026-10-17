import { CommonGet } from '../../helpers/HttpClient';

export default {
  getTradingSummary,
  getProsumerEarnings,
  getNodePerformance,
  getSlotUtilization,
  getDeliveredVsBooked,
  getReservationStatus,
  getOperatorActivity,
  getProsumerRegistrations,
  getNodes,
  getProsumers,
  getDashboardSummary,
  getRecentActivity
};

// Dashboard Recent Activity feed - newest events first.
async function getRecentActivity(limit = 8) {
  const response = await CommonGet('/api/Reporting/recent-activity', 'limit=' + limit);
  if (response.statusCode !== 'Success') {
    throw new Error(response.message || 'Failed to load recent activity.');
  }
  return response.data || [];
}

// Dashboard tiles + Energy Generation chart (last `days` days, bucketed on the viewer's clock).
async function getDashboardSummary(days = 14) {
  const response = await CommonGet('/api/Reporting/dashboard', 'tzOffsetMinutes=' + -new Date().getTimezoneOffset() + '&days=' + days);
  if (response.statusCode !== 'Success') {
    throw new Error(response.message || 'Failed to load the dashboard summary.');
  }
  return response.data;
}

// Every report endpoint takes the same optional filters; empty values are left out so the
// API falls back to its own defaults (last 30 days, all nodes).
function toQuery(filters) {
  const params = {
    from: filters.from,
    to: filters.to,
    nodeId: filters.nodeId,
    prosumerNic: filters.prosumerNic,
    status: filters.status,
    tzOffsetMinutes: -new Date().getTimezoneOffset()
  };
  return Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => k + '=' + encodeURIComponent(params[k]))
    .join('&');
}

async function getReport(path, filters) {
  const response = await CommonGet('/api/Reporting/' + path, toQuery(filters));
  if (response.statusCode !== 'Success') {
    throw new Error(response.message || 'Failed to load the report.');
  }
  return response.data;
}

async function getTradingSummary(filters) {
  return getReport('trading-summary', filters);
}

async function getProsumerEarnings(filters) {
  return getReport('prosumer-earnings', filters);
}

async function getNodePerformance(filters) {
  return getReport('node-performance', filters);
}

async function getSlotUtilization(filters) {
  return getReport('slot-utilization', filters);
}

async function getDeliveredVsBooked(filters) {
  return getReport('delivered-vs-booked', filters);
}

async function getReservationStatus(filters) {
  return getReport('reservation-status', filters);
}

async function getOperatorActivity(filters) {
  return getReport('operator-activity', filters);
}

async function getProsumerRegistrations(filters) {
  return getReport('prosumer-registrations', filters);
}

async function getNodes() {
  const response = await CommonGet('/api/Node', null);
  return response.data || [];
}

async function getProsumers() {
  const response = await CommonGet('/api/Prosumer', null);
  return response.data || [];
}
