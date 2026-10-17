import React from 'react';
import ReportPage from '../Components/ReportPage';
import { ChartCard, ChartRow, BarChart, DoughnutChart, COLORS } from '../Components/Charts';
import services from '../Services';

const columns = [
  { key: 'createdDate', label: 'Registered', type: 'date' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'nic', label: 'NIC', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phoneNumber', label: 'Phone', type: 'text' },
  { key: 'approvalStatus', label: 'Status', type: 'status' },
  { key: 'approvedBy', label: 'Decided By', type: 'text' },
  { key: 'approvedDate', label: 'Decided On', type: 'date' },
  { key: 'rejectionReason', label: 'Rejection Reason', type: 'text' }
];

const reasonColumns = [
  { key: 'reason', label: 'Rejection Reason', type: 'text' },
  { key: 'count', label: 'Registrations', type: 'integer' }
];

export default function ProsumerRegistrations() {
  return (
    <ReportPage
      screenCode="RPTPROSUMERREGISTRATION"
      title="Prosumer Registrations & Approvals"
      description="New Prosumer sign-ups in the period, how they were decided, how long approval took and why registrations were rejected."
      load={services.getProsumerRegistrations}
      showNodeFilter={false}
      statusOptions={['Pending', 'Approved', 'Rejected']}
      defaultDays={90}
      build={(data) => {
        const s = data.summary;
        const sections = [{ title: 'Registrations', columns, rows: data.rows }];
        if (data.rejectionReasons.length) {
          sections.push({ title: 'Rejection Reasons', columns: reasonColumns, rows: data.rejectionReasons, totals: { count: s.rejected } });
        }
        return {
          kpis: [
            { label: 'New Registrations', value: s.total, type: 'integer' },
            { label: 'Approved', value: s.approved, type: 'integer' },
            { label: 'Pending', value: s.pending, type: 'integer', hint: 'Awaiting a decision' },
            { label: 'Rejected', value: s.rejected, type: 'integer' },
            { label: 'Avg Approval Time', value: s.avgApprovalHours ? s.avgApprovalHours + ' hrs' : '—', type: 'text' }
          ],
          charts: (
            <ChartRow>
              <ChartCard title="Registrations over time">
                <BarChart
                  labels={data.trend.map((t) => t.period)}
                  datasets={[{ label: 'Registrations', data: data.trend.map((t) => t.registrations), backgroundColor: COLORS.green }]}
                />
              </ChartCard>
              <ChartCard title="Approval outcome">
                <DoughnutChart
                  labels={['Approved', 'Pending', 'Rejected']}
                  values={[s.approved, s.pending, s.rejected]}
                  colors={[COLORS.green, COLORS.amber, COLORS.red]}
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
