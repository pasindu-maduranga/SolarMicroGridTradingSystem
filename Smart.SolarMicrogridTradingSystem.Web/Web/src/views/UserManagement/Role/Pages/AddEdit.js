import React, { useState, useEffect, Fragment } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box, Card, Grid, TextField, makeStyles, Container, Button,
  CardContent, Divider, InputLabel, Switch, CardHeader, Typography
} from '@material-ui/core';
import Page from 'src/components/Page';
import services from '../Services';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from "yup";
import PageHeader from 'src/views/Common/PageHeader';
import { useAlert } from "react-alert";
import { LoadingComponent } from '../../../../utils/newLoader';
import { trackPromise } from 'react-promise-tracker';
import permissionService from "../../../../utils/permissionAuth";
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
  },
  modernButton: {
    borderRadius: 8,
    padding: '8px 24px',
    textTransform: 'none',
    fontWeight: 600,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.08)'
  }
}));

const screenCode = 'ROLE';
export default function RoleAddEdit(props) {
  const [title, setTitle] = useState("Add Role")
  const [isUpdate, setIsUpdate] = useState(false);
  const [isDisableButton, setIsDisableButton] = useState(false);
  const classes = useStyles();
  const [role, setRole] = useState({
    level: '',
    roleName: '',
    isActive: true
  });

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/app/roles/listing');
  }
  const alert = useAlert();
  const { roleID } = useParams();
  let decrypted = 0;

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    decrypted = atob(roleID.toString());
    if (decrypted != 0) {
      trackPromise(
        getRoleDetails(decrypted)
      )
    }
  }, []);

  async function getPermissions() {
    var permissions = await permissionService.getPermissionsByScreen(screenCode);
    var isAuthorized = permissions.find(p => p.permissionCode == 'ADDEDITROLE');

    if (isAuthorized === undefined) {
      navigate('/unauthorized');
    }
  }

  async function getRoleDetails(roleID) {
    let data = await services.getRoleDetailsByID(roleID);
    setTitle("Update Role");
    setRole(data);
    setIsUpdate(true);
  }

  async function saveRole(values) {
    if (isUpdate == true) {

      let updateModel = {
        roleID: atob(roleID.toString()),
        level: parseInt(values.level),
        roleName: values.roleName,
        isActive: values.isActive,
      }

      let response = await services.updateRole(updateModel);
      if (response.statusCode == "Success") {
        alert.success(response.message);
        setIsDisableButton(true);
        navigate('/app/roles/listing');
      }
      else {
        alert.error(response.message);
      }
    } else {
      let response = await services.saveRole(values);
      if (response.statusCode == "Success") {
        alert.success(response.message);
        setIsDisableButton(true);
        navigate('/app/roles/listing');
      }
      else {
        alert.error(response.message);
      }
    }
  }

  function handleChange1(e) {
    const target = e.target;
    const value = target.value
    setRole({
      ...role,
      [e.target.name]: value
    });
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
          />
        </Grid>
      </Grid>
    )
  }
  const handleKeyDownChange = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }
  return (
    <Fragment>
      <LoadingComponent />
      <Page className={classes.root} title={title}>
        <Container maxWidth={false}>
          <Formik
            initialValues={{
              level: role.level,
              roleName: role.roleName,
              isActive: role.isActive,
            }}
            validationSchema={
              Yup.object().shape({
                level: Yup.number().min(1, 'Level must be 1 or higher').required('Level is required'),
                roleName: Yup.string().max(255).required('Role Name is required')
              })
            }
            onSubmit={saveRole}
            enableReinitialize
          >
            {({
              errors,
              handleBlur,
              handleSubmit,
              handleChange,
              isSubmitting,
              touched,
              values
            }) => (
              <form onKeyDown={handleKeyDownChange} onSubmit={handleSubmit}>
                <Box mt={0}>
                  <Card className={classes.modernCard}>
                    <CardHeader
                      title={cardTitle(title)}
                    />

                    <PerfectScrollbar>
                      <Divider />
                      <CardContent>
                        <Grid container spacing={3}>


                          <Grid item md={4} xs={12}>
                            <InputLabel shrink id="level">
                              Level *
                            </InputLabel>
                            <TextField
                              error={Boolean(touched.level && errors.level)}
                              fullWidth
                              helperText={(touched.level && errors.level) || "Lower number = higher authority (1 is highest)"}
                              size='small'
                              name="level"
                              type="number"
                              onBlur={handleBlur}
                              onChange={(e) => handleChange1(e)}
                              value={role.level}
                              variant="outlined"
                              id="level"
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={3}>

                          <Grid item md={4} xs={12}>
                            <InputLabel shrink id="roleName">
                              Role Name *
                            </InputLabel>
                            <TextField
                              error={Boolean(touched.roleName && errors.roleName)}
                              fullWidth
                              helperText={touched.roleName && errors.roleName}
                              size='small'
                              name="roleName"
                              onBlur={handleBlur}
                              onChange={(e) => handleChange1(e)}
                              value={role.roleName}
                              variant="outlined"
                              disabled={isDisableButton}
                            />
                          </Grid>
                        </Grid>

                        <Grid container spacing={3}>
                          <Grid item md={4} xs={12}>
                            <InputLabel shrink id="isActive">
                              Active
                            </InputLabel>
                            <Switch
                              checked={values.isActive}
                              onChange={handleChange}
                              name="isActive"
                              disabled={isDisableButton}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                      <Box display="flex" justifyContent="flex-end" p={2}>
                        <Button
                          className={classes.modernButton}
                          style={{ backgroundColor: '#111827', color: '#FFF' }}
                          disabled={isSubmitting || isDisableButton}
                          type="submit"
                          variant="contained"
                          size='medium'
                        >
                          {isUpdate == true ? "Update" : "Save"}
                        </Button>
                      </Box>
                    </PerfectScrollbar>
                  </Card>
                </Box>
              </form>
            )}
          </Formik>
        </Container>
      </Page>
    </Fragment>
  );
};
