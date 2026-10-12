import React, { useState, useEffect } from 'react';
import Page from 'src/components/Page';
import GreetingHero from './GreetingHero';
import DashboardStatCard from './DashboardStatCard';
import userService from 'src/views/UserManagement/User/Services';
import nodeService from 'src/views/MicrogridNodeManagement/Services';

const icon = (path, color) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const EmptyPanel = ({ title, iconPath, message, hint }) => (
  <div className="flex-1 bg-white border border-[#E6DDC4] rounded-2xl p-[22px] flex flex-col gap-3.5">
    <div className="flex items-center gap-2.5">
      {icon(iconPath, '#2F6B45')}
      <div className="text-[15px] font-bold text-[#22201A]">{title}</div>
    </div>
    <div className="flex-1 rounded-xl bg-[#FBFAF6] border border-dashed border-[#E6DDC4] flex flex-col items-center justify-center gap-1.5 text-center p-6 min-h-[180px]">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A9A290" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPath}</svg>
      <div className="text-[13.5px] font-semibold text-[#726A58]">{message}</div>
      <div className="text-xs text-[#A9A290] max-w-[320px]">{hint}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [totalStaff, setTotalStaff] = useState(null);
  const [activeNodes, setActiveNodes] = useState(null);

  useEffect(() => {
    getTotalStaff();
    getActiveNodes();
  }, []);

  async function getTotalStaff() {
    const users = await userService.getAllUsers();
    setTotalStaff(Array.isArray(users) ? users.length : 0);
  }

  async function getActiveNodes() {
    const nodes = await nodeService.getAllNodes();
    setActiveNodes(Array.isArray(nodes) ? nodes.filter((n) => n.isActive).length : 0);
  }

  return (
    <Page title="Dashboard" className="min-h-full bg-[#F5F4EF] pt-7 pb-7 px-4 lg:px-8">
      <GreetingHero />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[18px] mt-[22px]">
        <DashboardStatCard
          live
          icon={icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, '#2F6B45')}
          value={totalStaff === null ? '—' : totalStaff}
          label="Total Staff"
        />
        <DashboardStatCard
          live
          icon={icon(<path d="M13 2 4 14h6l-1 8 9-12h-6z" />, '#2A7EAE')}
          iconBg="#E0F2FE"
          value={activeNodes === null ? '—' : activeNodes}
          label="Active Microgrid Nodes"
        />
        <DashboardStatCard
          icon={icon(<><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /></>, '#B7791F')}
          iconBg="#FEF3C7"
          value="—"
          label="Registered Prosumers"
          sublabel="Coming soon"
        />
        <DashboardStatCard
          icon={icon(<><rect x="3" y="4" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" /></>, '#6D4FC7')}
          iconBg="#EDE9FE"
          value="—"
          label="Today's Reservations"
          sublabel="Coming soon"
        />
        <DashboardStatCard
          icon={icon(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, '#C0392B')}
          iconBg="#FCE7E7"
          value="—"
          label="Pending Approvals"
          sublabel="Coming soon"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-[22px] mt-[22px]">
        <div className="flex-[1.4]">
          <EmptyPanel
            title="Energy Generation"
            iconPath={<><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></>}
            message="No generation data yet"
            hint="Connect your first Microgrid Node to see live output here."
          />
        </div>
        <div className="flex-1">
          <EmptyPanel
            title="Recent Activity"
            iconPath={<path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
            message="Nothing to show yet"
            hint="Activity from Nodes and Reservations will appear here once those modules go live."
          />
        </div>
      </div>
    </Page>
  );
};

export default Dashboard;
