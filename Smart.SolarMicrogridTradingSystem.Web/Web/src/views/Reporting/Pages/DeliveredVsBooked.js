import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, BarChart, COLORS } from '../Components/Charts';
import services from '../Services';
import { sum } from '../utils/aggregate';

const nodeColumns = [
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'bookedKwh', label: 'Booked', type: 'kwh' },
  { key: 'deliveredKwh', label: 'Delivered', type: 'kwh' },
  { key: 'varianceKwh', label: 'Variance', type: 'kwh' },
  { key: 'deliveryRate', label: 'Delivery Rate', type: 'percent' }
];

const detailColumns = [
  { key: 'completedDate', label: 'Verified', type: 'datetime' },
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'slotNumber', label: 'Slot', type: 'integer' },
  { key: 'prosumerName', label: 'Prosumer', type: 'text' },
  { key: 'bookedKwh', label: 'Booked', type: 'kwh' },
  { key: 'deliveredKwh', label: 'Delivered', type: 'kwh' },
  { key: 'varianceKwh', label: 'Variance', type: 'kwh' },
  { key: 'deliveryRate', label: 'Rate', type: 'percent' }
];

const rate = (delivered, booked) => (booked > 0 ? Math.round((delivered / booked) * 1000) / 10 : 0);

export default function DeliveredVsBooked() {
  return (
    <ReportPage
      screenCode="RPTDELIVEREDVSBOOKED"
      title="Delivered vs Booked Capacity"
      description="Compares the slot capacity Prosumers booked against the energy Grid Operators actually metered at the hub."
      load={services.getDeliveredVsBooked}
      build={(data) => {
        const s = data.summary;
        const byNode = data.byNode.map((n) => ({
          ...n,
          varianceKwh: Math.round((n.deliveredKwh - n.bookedKwh) * 100) / 100,
          deliveryRate: rate(n.deliveredKwh, n.bookedKwh)
        }));
        return {
          kpis: [
            { label: 'Delivery Rate', value: s.deliveryRate, type: 'percent' },
            { label: 'Booked Capacity', value: s.totalBookedKwh, type: 'kwh' },
            { label: 'Energy Delivered', value: s.totalDeliveredKwh, type: 'kwh' },
            { label: 'Completed Reservations', value: s.reservations, type: 'integer' },
            { label: 'Under-delivered', value: s.underDelivered, type: 'integer', hint: 'Delivered less than booked' }
          ],
          charts: (
            <ChartCard title="Booked vs delivered by node" subtitle="kWh">
              <BarChart
                labels={byNode.map((n) => n.nodeName)}
                datasets={[
                  { label: 'Booked', data: byNode.map((n) => n.bookedKwh), backgroundColor: COLORS.amber },
                  { label: 'Delivered', data: byNode.map((n) => n.deliveredKwh), backgroundColor: COLORS.green }
                ]}
                yLabel="kWh"
              />
            </ChartCard>
          ),
          sections: [
            {
              title: 'Summary by Node',
              columns: nodeColumns,
              rows: byNode,
              totals: {
                bookedKwh: s.totalBookedKwh,
                deliveredKwh: s.totalDeliveredKwh,
                varianceKwh: sum(byNode, 'varianceKwh'),
                deliveryRate: s.deliveryRate
              }
            },
            {
              title: 'Reservation Detail',
              columns: detailColumns,
              rows: data.rows,
              totals: {
                bookedKwh: s.totalBookedKwh,
                deliveredKwh: s.totalDeliveredKwh,
                varianceKwh: sum(data.rows, 'varianceKwh'),
                deliveryRate: s.deliveryRate
              }
            }
          ]
        };
      }}
    />
  );
}
