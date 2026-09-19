import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import NavBar from './NavBar';
import TopBar from './TopBar';
import { Modal } from 'react-responsive-modal';
import { Offline, Online, Detector } from "react-detect-offline"
import 'react-responsive-modal/styles.css';
import { ClassicSpinner } from "react-spinners-kit";
import { Grid } from '@material-ui/core';
import LostConnectionView from 'src/views/errors/LostConnectionView';
import webConfigurationRead from 'src/utils/webConfigurationRead';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  wrapper: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    paddingTop: 70,
    [theme.breakpoints.up('lg')]: {
      paddingLeft: 275
    }
  },
  contentContainer: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden'
  },
  content: {
    flex: '1 1 auto',
    height: '100%',
    overflow: 'auto'
  }
}));

const DashboardLayout = () => {
  const classes = useStyles();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
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
                <Grid >
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
                </Grid >
            )}
          />
          :
          <></>
      }

      <div className={classes.root} >
        <TopBar onMobileNavOpen={() => setMobileNavOpen(true)} />

        <NavBar
          onMobileClose={() => setMobileNavOpen(false)}
          openMobile={isMobileNavOpen}
        />

        <div className={classes.wrapper}>
          <div className={classes.contentContainer}>
            <div className={classes.content}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
