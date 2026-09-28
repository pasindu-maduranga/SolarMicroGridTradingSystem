import React, { useState, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box, Card, Typography, makeStyles, Container, CardHeader, CardContent, Divider, Grid
} from '@material-ui/core';
import Page from 'src/components/Page';
import PageHeader from 'src/views/Common/PageHeader';
import services from '../Services';
import { useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import MaterialTable from "material-table";
import permissionService from "../../../../utils/permissionAuth";
import { LoadingComponent } from 'src/utils/newLoader';
import CustomColumnMenu from 'src/components/CustomColumnMenu';

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

const screenCode = 'ROLE';

export default function RoleListing() {
  const classes = useStyles();
  const [roleData, setRoleData] = useState([]);

  const handleHideColumn = (field) => {
    setColumns(prev => prev.map(col => col.field === field ? { ...col, hidden: true } : col));
  };

  const handleManageColumns = () => {
    setColumns(prev => prev.map(col => ({ ...col, hidden: false })));
  };

  const [columns, setColumns] = useState([
    { title: <CustomColumnMenu columnName="Role Name" onHideColumn={() => handleHideColumn('roleName')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'roleName' },
    {
      title: <CustomColumnMenu columnName="Status" onHideColumn={() => handleHideColumn('isActive')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'isActive', lookup: {
        true: 'Active',
        false: 'Inactive'
      }
    },
    { title: <CustomColumnMenu columnName="Level" onHideColumn={() => handleHideColumn('level')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />, field: 'level' },
    {
      title: <CustomColumnMenu columnName="Created Date" onHideColumn={() => handleHideColumn('createdDate')} onManageColumns={handleManageColumns} onCustomAction={(col) => alert(`Custom Action on ${col}`)} />,
      field: 'createdDate',
      type: 'date',
      dateSetting: { format: 'yyyy/MM/dd' }
    }
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    trackPromise(getPermissions())
    trackPromise(getRoles())
  }, []);

  async function getPermissions() {
    var permissions = await permissionService.getPermissionsByScreen(screenCode);
    var isAuthorized = permissions.find(p => p.permissionCode == 'VIEWROLE');

    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  async function getRoles() {
    var result = await services.getAllRoles();
    setRoleData(result);
  }

  let encrypted = "";
  const handleClick = () => {
    encrypted = btoa('0');
    navigate('/app/roles/addedit/' + encrypted);
  }

  const handleClickEdit = (roleID) => {
    encrypted = btoa(roleID.toString());
    navigate('/app/roles/addedit/' + encrypted);
  }

  const handleClickPermission = (roleID, level) => {
    encrypted = btoa(roleID.toString());
    let encrypted1 = btoa(level.toString());

    navigate('/app/rolePermission/listing/' + encrypted + "/" + encrypted1);
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
            toolTiptitle={"Add Role"}
          />
        </Grid>
      </Grid>
    )
  }

  return (
    <Page
      className={classes.root}
      title="Roles"
    >
      <LoadingComponent />
      <Container maxWidth={false}>
        <Box mt={0}>
          <Card className={classes.modernCard}>
            <CardHeader
              title={cardTitle("Role")}
            />
            <PerfectScrollbar>
              <Divider />
              <CardContent style={{ marginBottom: "2rem" }}>
                <Grid container spacing={3}>
                  <Grid item md={12} xs={12}>
                    <MaterialTable
                      title="Multiple Actions Preview"
                      columns={columns}
                      data={roleData}
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
                          icon: 'mode',
                          tooltip: 'Edit Role',
                          onClick: (event, rowData) => { handleClickEdit(rowData.roleID) }
                        },
                        {
                          icon: 'list',
                          tooltip: 'Change Permission',
                          onClick: (event, rowData) => { handleClickPermission(rowData.roleID, rowData.level) }
                        }
                      ]}
                    />

                  </Grid>
                </Grid>

              </CardContent>
            </PerfectScrollbar>

          </Card>
        </Box>
      </Container>
    </Page>
  );
};