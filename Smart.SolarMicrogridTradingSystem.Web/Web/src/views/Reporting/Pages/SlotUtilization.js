import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, Heatmap } from '../Components/Charts';
import services from '../Services';
import { sum } from '../utils/aggregate';

const columns = [
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'slotNumber', label: 'Slot', type: 'integer', noSum: true },
  { key: 'capacityKwh', label: 'Daily Capacity', type: 'kwh' },
  { key: 'unitPricePerKwh', label: 'Price / kWh', type: 'currency' },
  { key: 'bookings', label: 'Bookings', type: 'integer' },
  { key: 'completed', label: 'Completed', type: 'integer' },
  { key: 'deliveredKwh', label: 'Delivered', type: 'kwh' },
  { key: 'utilization', label: 'Utilization', type: 'percent' }
];

export default function SlotUtilization() {
  return (
    <ReportPage
      screenCode="RPTSLOTUTILIZATION"
      title="Slot Utilization"
      description="How much of each slot's daily capacity was actually used, which slots sit idle, and when Prosumers prefer to book."
      load={services.getSlotUtilization}
      build={(data) => {
        const s = data.summary;
        return {
          kpis: [
            { label: 'Avg Utilization', value: s.avgUtilization, type: 'percent', hint: 'Delivered vs capacity × ' + s.days + ' days' },
            { label: 'Slots', value: s.slots, type: 'integer' },
            { label: 'Idle Slots', value: s.idleSlots, type: 'integer', hint: 'No bookings in period' },
            { label: 'Bookings', value: s.totalBookings, type: 'integer' },
            { label: 'Days in Period', value: s.days, type: 'integer' }
          ],
          charts: (
            <ChartCard title="Booking heatmap" subtitle="Scheduled drop-offs by weekday and hour (your local time)" height="auto">
              <Heatmap grid={data.heatmap} />
            </ChartCard>
          ),
          sections: [
            {
              title: 'Utilization by Slot',
              columns,
              rows: data.rows,
              totals: {
                capacityKwh: sum(data.rows, 'capacityKwh'),
                bookings: sum(data.rows, 'bookings'),
                completed: sum(data.rows, 'completed'),
                deliveredKwh: sum(data.rows, 'deliveredKwh'),
                utilization: s.avgUtilization
              }
            }
          ]
        };
      }}
    />
  );
}
