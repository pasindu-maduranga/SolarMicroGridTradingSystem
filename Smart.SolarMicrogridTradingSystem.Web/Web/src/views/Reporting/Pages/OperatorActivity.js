import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, HBarChart, COLORS } from '../Components/Charts';
import services from '../Services';

const columns = [
  { key: 'operatorName', label: 'Operator', type: 'text' },
  { key: 'userName', label: 'Username', type: 'text' },
  { key: 'assignedNode', label: 'Assigned Node', type: 'text' },
  { key: 'verifications', label: 'Verifications', type: 'integer' },
  { key: 'energyKwh', label: 'Energy Verified', type: 'kwh' },
  { key: 'amount', label: 'Payout Verified', type: 'currency' },
  { key: 'lastVerification', label: 'Last Verification', type: 'datetime' }
];

export default function OperatorActivity() {
  return (
    <ReportPage
      screenCode="RPTOPERATORACTIVITY"
      title="Grid Operator Activity"
      description="QR verifications recorded by each Grid Operator at the hubs, with the energy and payout they signed off."
      load={services.getOperatorActivity}
      build={(data) => {
        const s = data.summary;
        const active = data.rows.filter((r) => r.verifications > 0);
        return {
          kpis: [
            { label: 'Verifications', value: s.totalVerifications, type: 'integer' },
            { label: 'Energy Verified', value: s.totalEnergyKwh, type: 'kwh' },
            { label: 'Operators', value: s.operators, type: 'integer' },
            { label: 'Active Operators', value: s.activeOperators, type: 'integer', hint: 'At least one verification' },
            { label: 'Avg / Active Operator', value: s.activeOperators ? Math.round((s.totalVerifications / s.activeOperators) * 10) / 10 : 0, type: 'number' }
          ],
          charts: (
            <ChartCard title="Verifications by operator" height={Math.max(200, active.length * 34)}>
              <HBarChart
                labels={active.map((r) => r.operatorName)}
                datasets={[{ label: 'Verifications', data: active.map((r) => r.verifications), backgroundColor: COLORS.blue }]}
              />
            </ChartCard>
          ),
          sections: [
            {
              title: 'Operator Activity',
              columns,
              rows: data.rows,
              totals: { verifications: s.totalVerifications, energyKwh: s.totalEnergyKwh, amount: Math.round(data.rows.reduce((t, r) => t + r.amount, 0) * 100) / 100 }
            }
          ]
        };
      }}
    />
  );
}
