import React, { useEffect, Fragment } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Card,
  Grid,
  makeStyles,
  Container,
  CardContent,
  Divider,
  CardHeader
} from '@material-ui/core';
import Page from 'src/components/Page';
import { useNavigate } from 'react-router-dom';
import PageHeader from 'src/views/Common/PageHeader';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { TabPanel } from './tabPanel';
import AppBar from '@material-ui/core/AppBar';
import { ScreenConfig } from './TabPages/ScreenConfig';
import { MenuConfig } from './TabPages/MenuConfig';
import { ParentMenuConfig } from './TabPages/ParentMenuConfig';
import { trackPromise } from 'react-promise-tracker';
import { LoadingComponent } from '../../../../utils/newLoader';
import authService from '../../../../utils/permissionAuth';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  },
  avatar: {
    marginRight: theme.spacing(2)
  },
  root1: {
    flexGrow: 4
  },

}));

const screenCode = 'SCREENMANAGER';
export default function ScreenManagerAddEdit() {
  const classes = useStyles();
  const title = "Screen Manager";

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/app/dashboard');
  }
  const [value, setValue] = React.useState(0);
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };
  useEffect(() => {
    trackPromise(getPermission());
  }, []);

  async function getPermission() {
    var permissions = await authService.getPermissionsByScreen(screenCode);
    var isAuthorized = permissions.find(p => p.permissionCode == 'VIEWSCREENMANAGER');

    if (isAuthorized === undefined) {
      navigate('/404');
    }
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  function cardTitle(titleName) {
    return (
      <Grid container spacing={1}>
        <Grid item md={10} xs={12}>
          {titleName}
        </Grid>
        <Grid item md={2} xs={12}>
          <PageHeader
            onClick={handleClick}
          />
        </Grid>
      </Grid>
    )

  }

  return (
    <Fragment>
      <LoadingComponent />
      <Page className={classes.root} title="Screen Manager">
        <Container maxWidth={false}>
          <Card>
            <CardHeader
              title={cardTitle(title)}
            />

            <PerfectScrollbar>
              <Divider />
              <CardContent>
                <Grid container spacing={4}>
                  <Grid className={classes.root1} item xs={12}>
                    <AppBar position="static">
                      <Tabs value={value} onChange={handleTabChange} variant={'fullWidth'} classes={{ indicator: classes.indicator }}
                        aria-label="screen manager tabs" style={{ backgroundColor: "White" }}>
                        <Tab label="Parent Menu" {...a11yProps(0)} style={{ color: "black" }} />
                        <Tab label="Menu" {...a11yProps(1)} style={{ color: "black" }} />
                        <Tab label="Screen" {...a11yProps(2)} style={{ color: "black" }} />
                      </Tabs>
                    </AppBar>
                    <TabPanel value={value} index={0}>
                      <ParentMenuConfig />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                      <MenuConfig />
                    </TabPanel>
                    <TabPanel value={value} index={2}>
                      <ScreenConfig />
                    </TabPanel>
                  </Grid>
                </Grid>
              </CardContent>
            </PerfectScrollbar>
          </Card>
        </Container>
      </Page>
    </Fragment>
  );
};

