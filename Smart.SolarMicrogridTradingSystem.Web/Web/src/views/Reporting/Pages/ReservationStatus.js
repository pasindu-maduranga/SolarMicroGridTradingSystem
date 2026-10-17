import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, ChartRow, BarChart, DoughnutChart, COLORS } from '../Components/Charts';
import services from '../Services';

const columns = [
  { key: 'reservedDate', label: 'Booked On', type: 'datetime' },
  { key: 'scheduledDate', label: 'Scheduled For', type: 'datetime' },
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'slotNumber', label: 'Slot', type: 'integer' },
  { key: 'prosumerName', label: 'Prosumer', type: 'text' },
  { key: 'prosumerNic', label: 'NIC', type: 'text' },
  { key: 'displayStatus', label: 'Status', type: 'status' },
  { key: 'energyKwh', label: 'Energy', type: 'kwh' },
  { key: 'amount', label: 'Amount', type: 'currency' }
];

export default function ReservationStatus() {
  return (
    <ReportPage
      screenCode="RPTRESERVATIONSTATUS"
      title="Reservation Status"
      description="Outcome of every reservation booked in the period. Overdue = still Active although its scheduled time has passed without a QR verification."
      load={services.getReservationStatus}
      statusOptions={['Active', 'Completed', 'Cancelled']}
      build={(data) => {
        const s = data.summary;
        const rows = data.rows.map((r) => ({ ...r, displayStatus: r.isOverdue ? 'Overdue' : r.status }));
        const overdue = rows.filter((r) => r.isOverdue);
        const sections = [{ title: 'All Reservations', columns, rows }];
        if (overdue.length) {
          sections.unshift({ title: 'Overdue Reservations - Needs Follow-up', columns, rows: overdue });
        }
        return {
          kpis: [
            { label: 'Reservations', value: s.total, type: 'integer' },
            { label: 'Completed', value: s.completed, type: 'integer' },
            { label: 'Active', value: s.active, type: 'integer' },
            { label: 'Cancelled', value: s.cancelled, type: 'integer' },
            { label: 'Overdue', value: s.overdue, type: 'integer', hint: 'Past scheduled time, not verified' }
          ],
          charts: (
            <ChartRow>
              <ChartCard title="Daily bookings by outcome" subtitle="Grouped by the day the reservation was made">
                <BarChart
                  stacked
                  labels={data.trend.map((t) => t.day)}
                  datasets={[
                    { label: 'Completed', data: data.trend.map((t) => t.completed), backgroundColor: COLORS.green },
                    { label: 'Active', data: data.trend.map((t) => t.active), backgroundColor: COLORS.blue },
                    { label: 'Cancelled', data: data.trend.map((t) => t.cancelled), backgroundColor: COLORS.grey }
                  ]}
                />
              </ChartCard>
              <ChartCard title="Status mix">
                <DoughnutChart
                  labels={['Completed', 'Active (on time)', 'Overdue', 'Cancelled']}
                  values={[s.completed, s.active - s.overdue, s.overdue, s.cancelled]}
                  colors={[COLORS.green, COLORS.blue, COLORS.red, COLORS.grey]}
                />
              </ChartCard>
            </ChartRow>
          ),
          sections
        };
      }}
    />
  );
}
