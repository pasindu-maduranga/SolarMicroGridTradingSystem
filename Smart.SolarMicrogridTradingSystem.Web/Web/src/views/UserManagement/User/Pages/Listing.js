import React, { useState, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  Typography,
  makeStyles,
  Container,
  CardHeader,
  Grid
} from '@material-ui/core';
import Page from 'src/components/Page';
import PageHeader from 'src/views/Common/PageHeader';
import services from '../Services';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import NoEncryptionIcon from '@material-ui/icons/NoEncryption';
import MaterialTable from "material-table";
import authService from '../../../../utils/permissionAuth';
import CustomColumnMenu from '../../../../components/CustomColumnMenu';

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
  modernCard: {
    borderRadius: 16,
    boxShadow: '0px 8px 24px rgba(0,0,0,0.06)',
    border: 'none',
    padding: theme.spacing(2)
  },
  modernHeader: {
    fontFamily: '"Montserrat", "Inter", sans-serif',
    fontWeight: 600,
    fontSize: '1.25rem',
    color: '#111827'
  }
}));

const screenCode = 'USER';
export default function UserListing(props) {
  const classes = useStyles();
  const [userData, setUserData] = useState([]);

  const handleHideColumn = (field) => {
    setColumns(prev => prev.map(col => col.field === field ? { ...col, hidden: true } : col));
  };

  const handleManageColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, hidden: false })));
  };

  const [columns, setColumns] = useState([
    { title: <CustomColumnMenu columnName="Username" onHideColumn={() => handleHideColumn('userName')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'userName' },
    { title: <CustomColumnMenu columnName="First Name" onHideColumn={() => handleHideColumn('firstName')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'firstName' },
    { title: <CustomColumnMenu columnName="Last Name" onHideColumn={() => handleHideColumn('lastName')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'lastName' },
    {
      title: <CustomColumnMenu columnName="Status" onHideColumn={() => handleHideColumn('isActive')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'isActive', lookup: {
        true: 'Active',
        false: 'Inactive'
      }
    },
  ]);
  const navigate = useNavigate();
  let encrypted = "";
  const handleClick = () => {
    encrypted = btoa('0');
    navigate('/app/users/addedit/' + encrypted);
  }

  const handleClickEdit = (userID) => {
    encrypted = btoa(userID.toString());
    navigate('/app/users/addedit/' + encrypted);
  }

  const handleClickChangePassword = (userID) => {
    encrypted = btoa(userID.toString());
    navigate('/app/users/passwordChange/' + encrypted);
  }

  useEffect(() => {
    trackPromise(getPermission());
    trackPromise(getUsers());
  }, []);

  async function getPermission() {
    var permissions = await authService.getPermissionsByScreen(screenCode);
    var isAuthorized = permissions.find(p => p.permissionCode == 'VIEWUSER');

    if (isAuthorized === undefined) {
      navigate('/404');
    }
  }

  async function getUsers() {
    var result = await services.getAllUsers();
    setUserData(result);
  }

  function cardTitle(titleName) {
    return (
      <Grid container spacing={1}>
        <Grid item md={10} xs={12}>
          <Typography className={classes.modernHeader}>
            {titleName}
          </Typography>
        </Grid>
        <Grid item md={2} xs={12}>
          <PageHeader
            onClick={handleClick}
            isEdit={true}
            toolTiptitle={"Add User"}
          />
        </Grid>
      </Grid>
    )
  }

  return (
    <Page
      className={classes.root}
      title="Users"
    >
      <Container maxWidth={false}>
        <Box mt={0}>
          <Card className={classes.modernCard}>
            <CardHeader
              title={cardTitle("User")}
            />
            <PerfectScrollbar>
              <Box minWidth={1000}>
                <MaterialTable
                  title="Multiple Actions Preview"
                  columns={columns}
                  data={userData}
                  options={{
                    exportButton: false,
                    showTitle: false,
                    headerStyle: { textAlign: "left", height: '1%', backgroundColor: '#F9FAFB', color: '#111827', fontWeight: 600, borderBottom: '1px solid #E5E7EB', padding: '16px' },
                    cellStyle: { textAlign: "left", borderBottom: '1px solid #F3F4F6', padding: '16px', color: '#4B5563' },
                    columnResizable: false,
                    actionsColumnIndex: -1,
                    columnsButton: true
                  }}
                  actions={[
                    {
                      icon: 'edit',
                      tooltip: 'Edit User',
                      onClick: (event, userData) => handleClickEdit(userData.userID)
                    },
                    {
                      icon: () => <NoEncryptionIcon />,
                      tooltip: 'Reset',
                      onClick: (event, userData) => handleClickChangePassword(userData.userID)
                    }
                  ]}
                />
              </Box>
            </PerfectScrollbar>
          </Card>
        </Box>
      </Container>
    </Page>
  );
};
