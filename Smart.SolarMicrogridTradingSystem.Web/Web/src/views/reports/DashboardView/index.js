import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import GreetingHero from './GreetingHero';
import DashboardStatCard from './DashboardStatCard';
import userService from 'src/views/UserManagement/User/Services';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  const [totalStaff, setTotalStaff] = useState(null);

  useEffect(() => {
    getTotalStaff();
  }, []);

  async function getTotalStaff() {
    const users = await userService.getAllUsers();
    setTotalStaff(Array.isArray(users) ? users.length : 0);
  }

  return (
    <Page
      className={classes.root}
      title="Dashboard"
    >
      <Container maxWidth={false}>
        <GreetingHero />
        <Grid container spacing={3} style={{ marginTop: -60, position: 'relative', zIndex: 10 }}>

          <Grid item lg={4} md={6} sm={6} xs={12}>
            <DashboardStatCard
              icon="🧑‍💻"
              value={totalStaff === null ? '—' : totalStaff}
              label="Total Staff"
              sublabel="Backoffice & Grid Operator accounts"
            />
          </Grid>

          <Grid item lg={4} md={6} sm={6} xs={12}>
            <DashboardStatCard
              icon="🔌"
              iconBg="#E0F2FE"
              value="—"
              label="Active Microgrid Nodes"
              sublabel="Coming soon"
            />
          </Grid>

          <Grid item lg={4} md={6} sm={6} xs={12}>
            <DashboardStatCard
              icon="🙋"
              iconBg="#FEF3C7"
              value="—"
              label="Registered Prosumers"
              sublabel="Coming soon"
            />
          </Grid>

          <Grid item lg={4} md={6} sm={6} xs={12}>
            <DashboardStatCard
              icon="📅"
              iconBg="#EDE9FE"
              value="—"
              label="Today's Reservations"
              sublabel="Coming soon"
            />
          </Grid>

          <Grid item lg={4} md={6} sm={6} xs={12}>
            <DashboardStatCard
              icon="⏳"
              iconBg="#FCE7E7"
              value="—"
              label="Pending Approvals"
              sublabel="Coming soon"
            />
          </Grid>

        </Grid>
      </Container>
    </Page>
  );
};

export default Dashboard;
