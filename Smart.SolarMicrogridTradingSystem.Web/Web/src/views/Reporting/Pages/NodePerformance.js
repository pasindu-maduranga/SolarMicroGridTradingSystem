import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, ChartRow, BarChart, COLORS } from '../Components/Charts';
import services from '../Services';
import { sum } from '../utils/aggregate';

const columns = [
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'slots', label: 'Slots', type: 'integer' },
  { key: 'bookings', label: 'Bookings', type: 'integer' },
  { key: 'completed', label: 'Completed', type: 'integer' },
  { key: 'cancelled', label: 'Cancelled', type: 'integer' },
  { key: 'active', label: 'Active', type: 'integer' },
  { key: 'completionRate', label: 'Completion', type: 'percent' },
  { key: 'cancellationRate', label: 'Cancellation', type: 'percent' },
  { key: 'energyKwh', label: 'Energy Received', type: 'kwh' },
  { key: 'payout', label: 'Payout', type: 'currency' }
];

export default function NodePerformance() {
  return (
    <ReportPage
      screenCode="RPTNODEPERFORMANCE"
      title="Node Performance"
      description="How each microgrid hub performed - bookings received, how they ended, and the energy and payout recorded at the node."
      load={services.getNodePerformance}
      build={(data) => {
        const s = data.summary;
        const rows = data.rows.map((r) => ({ ...r, state: r.isActive ? 'Active' : 'Inactive' }));
        return {
          kpis: [
            { label: 'Energy Received', value: s.totalEnergyKwh, type: 'kwh' },
            { label: 'Total Payout', value: s.totalPayout, type: 'currency' },
            { label: 'Bookings', value: s.totalBookings, type: 'integer' },
            { label: 'Completion Rate', value: s.completionRate, type: 'percent' },
            { label: 'Active Nodes', value: s.activeNodes + ' / ' + s.nodes, type: 'text' }
          ],
          charts: (
            <ChartRow>
              <ChartCard title="Booking outcomes by node" subtitle="Completed, active and cancelled bookings">
                <BarChart
                  stacked
                  labels={rows.map((r) => r.nodeName)}
                  datasets={[
                    { label: 'Completed', data: rows.map((r) => r.completed), backgroundColor: COLORS.green },
                    { label: 'Active', data: rows.map((r) => r.active), backgroundColor: COLORS.blue },
                    { label: 'Cancelled', data: rows.map((r) => r.cancelled), backgroundColor: COLORS.grey }
                  ]}
                />
              </ChartCard>
              <ChartCard title="Energy received" subtitle="kWh verified at each node">
                <BarChart
                  labels={rows.map((r) => r.nodeName)}
                  datasets={[{ label: 'Energy (kWh)', data: rows.map((r) => r.energyKwh), backgroundColor: COLORS.amber }]}
                  yLabel="kWh"
                />
              </ChartCard>
            </ChartRow>
          ),
          sections: [
            {
              title: 'Node Performance',
              columns,
              rows,
              totals: {
                slots: sum(rows, 'slots'),
                bookings: sum(rows, 'bookings'),
                completed: sum(rows, 'completed'),
                cancelled: sum(rows, 'cancelled'),
                active: sum(rows, 'active'),
                completionRate: s.completionRate,
                energyKwh: s.totalEnergyKwh,
                payout: s.totalPayout
              }
            }
          ]
        };
      }}
    />
  );
}
