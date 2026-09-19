import React, { useState, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  Grid,
  TextField,
  makeStyles,
  Container,
  Button,
  CardContent,
  Divider,
  InputLabel,
  CardHeader,
} from '@material-ui/core';
import Page from 'src/components/Page';
import services from '../Services';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from "yup";
import PageHeader from 'src/views/Common/PageHeader';
import { useAlert } from "react-alert";
import { trackPromise } from 'react-promise-tracker';
import authService from '../../../../utils/permissionAuth';

const screenCode = 'USER';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3)
  },
  avatar: {
    marginRight: theme.spacing(2)
  }
}));

export default function PasswordChange() {
  const title = "Reset Password";
  const classes = useStyles();
  const [isDisableButton, setIsDisableButton] = useState(false);
  const [user, setUser] = useState({
    userName: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/app/users/listing');
  }
  const alert = useAlert();
  const { userID } = useParams();
  let decrypted = 0;

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    decrypted = atob(userID.toString());
    if (decrypted != 0) {
      trackPromise(
        getUserDetails(decrypted)
      )
    }
  }, []);

  async function getUserDetails(userID) {
    let data = await services.getUserDetailsByID(userID);
    setUser(data);
  }

  async function changePassword(values) {
    values.userID = atob(userID.toString());
    let response = await services.ResetPassword(values);
    if (response.statusCode == "Success") {
      alert.success(response.message);
      setIsDisableButton(true);
      navigate('/app/users/listing');
    }
    else {
      alert.error(response.message);
    }
  }

  async function getPermissions() {
    var permissions = await authService.getPermissionsByScreen(screenCode);
    var isAuthorized = permissions.find(p => p.permissionCode == 'ADDEDITUSER');

    if (isAuthorized === undefined) {
      navigate('/404');
    }
  }

  function handleChange1(e) {
    const target = e.target;
    const value = target.value
    setUser({
      ...user,
      [e.target.name]: value
    });
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
    <Page className={classes.root} title={title}>
      <Container maxWidth={false}>
        <Formik
          initialValues={{
            userName: user.userName,
            password: user.password,
            newPassword: user.newPassword,
            confirmPassword: user.confirmPassword
          }}
          validationSchema={
            Yup.object().shape({
              userName: Yup.string().max(255).required('Username is required'),
              newPassword: Yup.string().min(6, 'At least 6 characters').max(64, "Cannot exceed 64 characters").required('New password required'),
              confirmPassword: Yup.string().required('Confirm password required').when("newPassword", {
                is: val => (val && val.length > 0 ? true : false),
                then: Yup.string().oneOf(
                  [Yup.ref("newPassword")],
                  "Both password need to be the same"
                )
              })
            })
          }
          onSubmit={changePassword}
          enableReinitialize
        >
          {({
            errors,
            handleBlur,
            handleChange,
            handleSubmit,
            isSubmitting,
            touched,
            values
          }) => (
            <form onSubmit={handleSubmit}>
              <Box mt={3}>
                <Card>
                  <CardHeader
                    title={cardTitle(title)}
                  />
                  <PerfectScrollbar>
                    <Divider />
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item md={4} xs={12}>
                          <InputLabel shrink id="userName">
                            Username *
                            </InputLabel>
                          <TextField
                            error={Boolean(touched.userName && errors.userName)}
                            fullWidth
                            helperText={touched.userName && errors.userName}
                            name="userName"
                            size = 'small'
                            onBlur={handleBlur}
                            onChange={(e) => handleChange1(e)}
                            value={user.userName}
                            InputProps={{
                              readOnly: true,
                            }}
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item md={4} xs={12}>
                          <InputLabel shrink id="newPassword">
                            New Password *
                            </InputLabel>
                          <TextField
                            error={Boolean(touched.newPassword && errors.newPassword)}
                            fullWidth
                            helperText={touched.newPassword && errors.newPassword}
                            name="newPassword"
                            type="newPassword"
                            size = 'small'
                            onBlur={handleBlur}
                            onChange={(e) => handleChange1(e)}
                            value={user.newPassword}
                            variant="outlined"
                            autoComplete={false}
                          />
                        </Grid>
                        <Grid item md={4} xs={12}>
                          <InputLabel shrink id="confirmPassword">
                            Confirm Password *
                            </InputLabel>
                          <TextField
                            error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                            fullWidth
                            helperText={touched.confirmPassword && errors.confirmPassword}
                            name="confirmPassword"
                            type="confirmPassword"
                            size = 'small'
                            onBlur={handleBlur}
                            onChange={(e) => handleChange1(e)}
                            value={user.confirmPassword}
                            variant="outlined"
                            autoComplete={false}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                    <Box display="flex" justifyContent="flex-end" p={2}>
                      <Button
                        color="primary"
                        disabled={isSubmitting || isDisableButton}
                        type="submit"
                        variant="contained"
                      >
                        {"Reset Password"}
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
  );
};
