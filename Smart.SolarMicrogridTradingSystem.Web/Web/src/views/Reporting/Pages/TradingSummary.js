import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, ChartRow, LineChart, HBarChart, COLORS } from '../Components/Charts';
import services from '../Services';
import { sum } from '../utils/aggregate';

const columns = [
  { key: 'period', label: 'Period', type: 'text' },
  { key: 'trades', label: 'Trades', type: 'integer' },
  { key: 'energyKwh', label: 'Energy Delivered', type: 'kwh' },
  { key: 'amount', label: 'Amount Paid', type: 'currency' },
  { key: 'avgPricePerKwh', label: 'Avg Price / kWh', type: 'currency', noSum: true }
];

export default function TradingSummary() {
  return (
    <ReportPage
      screenCode="RPTTRADINGSUMMARY"
      title="Energy Trading Summary"
      description="Verified energy trades across the microgrid - how much solar energy was bought from Prosumers and what was paid for it."
      load={services.getTradingSummary}
      build={(data) => {
        const s = data.summary;
        return {
          kpis: [
            { label: 'Energy Traded', value: s.totalEnergyKwh, type: 'kwh' },
            { label: 'Total Paid Out', value: s.totalAmount, type: 'currency' },
            { label: 'Trades', value: s.totalTrades, type: 'integer' },
            { label: 'Avg Price / kWh', value: s.avgPricePerKwh, type: 'currency' },
            { label: 'Trading Prosumers', value: s.activeProsumers, type: 'integer' }
          ],
          charts: (
            <ChartRow>
              <ChartCard title="Energy traded over time" subtitle={data.grouping + ' totals (kWh)'}>
                <LineChart
                  labels={data.rows.map((r) => r.period)}
                  datasets={[{ label: 'Energy (kWh)', data: data.rows.map((r) => r.energyKwh), borderColor: COLORS.green, backgroundColor: COLORS.greenSoft, pointBackgroundColor: COLORS.green }]}
                  yLabel="kWh"
                />
              </ChartCard>
              <ChartCard title="Energy by node" subtitle="kWh delivered per hub">
                <HBarChart
                  labels={data.byNode.map((n) => n.nodeName)}
                  datasets={[{ label: 'Energy (kWh)', data: data.byNode.map((n) => n.energyKwh), backgroundColor: COLORS.amber }]}
                />
              </ChartCard>
            </ChartRow>
          ),
          sections: [
            {
              title: data.grouping + ' Trading Breakdown',
              columns,
              rows: data.rows,
              totals: {
                trades: sum(data.rows, 'trades'),
                energyKwh: sum(data.rows, 'energyKwh'),
                amount: sum(data.rows, 'amount'),
                avgPricePerKwh: s.avgPricePerKwh
              }
            }
          ]
        };
      }}
    />
  );
}
