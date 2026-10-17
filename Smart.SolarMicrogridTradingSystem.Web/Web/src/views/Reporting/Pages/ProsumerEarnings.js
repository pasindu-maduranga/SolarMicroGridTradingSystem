import React, { useEffect, useState } from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, HBarChart, COLORS } from '../Components/Charts';
import services from '../Services';
import { sum } from '../utils/aggregate';

const columns = [
  { key: 'prosumerName', label: 'Prosumer', type: 'text' },
  { key: 'prosumerNic', label: 'NIC', type: 'text' },
  { key: 'trades', label: 'Trades', type: 'integer' },
  { key: 'energyKwh', label: 'Energy Delivered', type: 'kwh' },
  { key: 'amount', label: 'Total Earned', type: 'currency' },
  { key: 'avgPricePerKwh', label: 'Avg Price / kWh', type: 'currency', noSum: true },
  { key: 'lastTradeDate', label: 'Last Trade', type: 'date' }
];

const statementColumns = [
  { key: 'completedDate', label: 'Date', type: 'datetime' },
  { key: 'nodeName', label: 'Node', type: 'text' },
  { key: 'slotNumber', label: 'Slot', type: 'integer' },
  { key: 'energyKwh', label: 'Energy', type: 'kwh' },
  { key: 'unitPricePerKwh', label: 'Price / kWh', type: 'currency', noSum: true },
  { key: 'amount', label: 'Amount', type: 'currency' },
  { key: 'verifiedBy', label: 'Verified By', type: 'text' }
];

export default function ProsumerEarnings() {
  const [prosumers, setProsumers] = useState([]);

  useEffect(() => {
    // The dropdown is optional - if the Prosumer API is unavailable the report itself still
    // works, so a failure here must not surface as a runtime error.
    services
      .getProsumers()
      .then((list) =>
        setProsumers(
          list
            .filter((p) => p.approvalStatus === 'Approved')
            .map((p) => ({ nic: p.nic, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() }))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
      )
      .catch(() => setProsumers([]));
  }, []);

  const prosumerName = (nic) => (prosumers.find((p) => p.nic === nic) || {}).name || nic;

  return (
    <ReportPage
      screenCode="RPTPROSUMEREARNINGS"
      title="Prosumer Earnings"
      description="What each Prosumer earned from verified energy deliveries. Select a single Prosumer to get their itemised statement."
      load={services.getProsumerEarnings}
      extraFilters={(filters, setFilter, inputClass) => (
        <label className="flex flex-col gap-1.5 min-w-[220px]">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#726A58]">Prosumer</span>
          <select className={inputClass} value={filters.prosumerNic || ''} onChange={(e) => setFilter('prosumerNic', e.target.value)}>
            <option value="">All prosumers</option>
            {prosumers.map((p) => (
              <option key={p.nic} value={p.nic}>{p.name} ({p.nic})</option>
            ))}
          </select>
        </label>
      )}
      extraMeta={(filters) => [{ label: 'Prosumer', value: filters.prosumerNic ? prosumerName(filters.prosumerNic) : 'All prosumers' }]}
      build={(data) => {
        const s = data.summary;
        const top = data.rows.slice(0, 10);
        const sections = [
          {
            title: 'Earnings by Prosumer',
            columns,
            rows: data.rows,
            totals: { trades: s.totalTrades, energyKwh: s.totalEnergyKwh, amount: s.totalAmount }
          }
        ];
        if (data.transactions) {
          sections.push({
            title: 'Statement of Trades',
            columns: statementColumns,
            rows: data.transactions,
            totals: { energyKwh: sum(data.transactions, 'energyKwh'), amount: sum(data.transactions, 'amount') }
          });
        }
        return {
          kpis: [
            { label: 'Total Earned', value: s.totalAmount, type: 'currency' },
            { label: 'Energy Delivered', value: s.totalEnergyKwh, type: 'kwh' },
            { label: 'Trades', value: s.totalTrades, type: 'integer' },
            { label: 'Earning Prosumers', value: s.prosumers, type: 'integer' },
            { label: 'Avg Earned / Prosumer', value: s.prosumers ? Math.round((s.totalAmount / s.prosumers) * 100) / 100 : 0, type: 'currency' }
          ],
          charts: (
            <ChartCard title="Top earners" subtitle="Highest total earnings in the period (Rs.)" height={Math.max(200, top.length * 34)}>
              <HBarChart
                labels={top.map((r) => r.prosumerName)}
                datasets={[{ label: 'Earned (Rs.)', data: top.map((r) => r.amount), backgroundColor: COLORS.green }]}
              />
            </ChartCard>
          ),
          sections
        };
      }}
    />
  );
}
