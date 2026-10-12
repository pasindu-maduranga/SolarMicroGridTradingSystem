import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import TopBar from './TopBar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { Modal } from 'react-responsive-modal';
import { Offline, Online, Detector } from "react-detect-offline"
import 'react-responsive-modal/styles.css';
import LostConnectionView from 'src/views/errors/LostConnectionView';
import webConfigurationRead from 'src/utils/webConfigurationRead';

const DashboardContent = () => {
  const { panelOpen } = useSidebar();

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F5F4EF]">
      <TopBar />
      <NavBar />
      <div className="flex flex-1 overflow-hidden pt-[70px]">
        <div className="hidden lg:block flex-shrink-0 transition-[width] duration-150" style={{ width: panelOpen ? 300 : 64 }} />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 h-full overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  const [ConnectionCheckConfiguration, setConnectionCheckConfiguration] = useState({
    isEnabled: true,
    interval: 5000,
    timeout: 5000
  })
  const styles = {
    modal: {
      backgroundColor: "transparent",
      boxShadow: "none",
      overflow: "none",
    },
  };

  useEffect(() => {
    GetConnectionCheckConfigDetails()
  }, [])

  async function GetConnectionCheckConfigDetails() {
    const response = await webConfigurationRead.ReadConnectionCheckConfig();
    if (response != null && response != undefined) {
      setConnectionCheckConfiguration(response);
    }
  }

  return (
    <>
      {
        ConnectionCheckConfiguration.isEnabled === true ?
          <Detector
            polling={{
              interval: ConnectionCheckConfiguration.interval,
              timeout: ConnectionCheckConfiguration.timeout,
            }}
            render={({ online }) => (
              online ?
                null
                :
                <Modal
                  center
                  open={true}
                  showCloseIcon={false}
                  focusTrapped={true}
                  styles={styles}
                  closeOnOverlayClick={false}
                >
                  <LostConnectionView />
                </Modal>
            )}
          />
          :
          <></>
      }

      <SidebarProvider>
        <DashboardContent />
      </SidebarProvider>
    </>
  );
};

export default DashboardLayout;
