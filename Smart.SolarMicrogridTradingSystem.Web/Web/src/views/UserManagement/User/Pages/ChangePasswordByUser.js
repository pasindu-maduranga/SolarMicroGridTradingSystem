import React, { useState, useEffect, Fragment } from 'react';
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
import { LoadingComponent } from './../../../../utils/newLoader';
import { Formik } from 'formik';
import * as Yup from "yup";
import { useAlert } from "react-alert";
import { trackPromise } from 'react-promise-tracker';


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

export default function ChangeUserPassword() {
    const classes = useStyles();
    const [FormDetails, setFormDetails] = useState({
        userName: '',
        userID: 0,
        userOldPassword: '',
        userNewPassword: '',
        userConfirmPassword: ''
    })
    const [SubmitDisable, setSubmitDisable] = useState(false)
    const navigate = useNavigate();
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
        } else {
            navigate('/404')
        }
    }, []);

    const handleChangePassword = () => {
        setSubmitDisable(true);
        trackPromise(ChangePassword());
    }

    async function getUserDetails(userID) {
        let response = await services.getUserDetailsByID(userID);
        setFormDetails({
            ...FormDetails,
            userName: response.userName,
            userID: response.userID
        });
    }

    async function ChangePassword() {
        let changeModel = {
            userId: FormDetails.userID,
            currentPassword: FormDetails.userOldPassword,
            newPassword: FormDetails.userNewPassword
        }

        const response = await services.ChangePassword(changeModel);

        if (response.statusCode == "Success") {
            alert.success(response.message);
            navigate('/app/dashboard')
        }
        else {
            setSubmitDisable(false);
            alert.error(response.message);
        }
    }

    async function getPermissions() {
    }

    function handleChange1(e) {
        const target = e.target;
        const value = target.value
        setFormDetails({
            ...FormDetails,
            [e.target.name]: value
        });
    }

    function cardTitle(titleName) {
        return (
            <Grid container spacing={1}>
                <Grid item md={10} xs={12}>
                    {titleName}
                </Grid>
            </Grid>
        )
    }

    return (
        <Fragment>
            <LoadingComponent />
            <Page className={classes.root} title={"Change Password"}>
                <Container maxWidth={false}>
                    <Formik
                        initialValues={{
                            userName: FormDetails.userName,
                            userID: FormDetails.userID,
                            userOldPassword: FormDetails.userOldPassword,
                            userNewPassword: FormDetails.userNewPassword,
                            userConfirmPassword: FormDetails.userConfirmPassword
                        }}
                        validationSchema={
                            Yup.object().shape({
                                userOldPassword: Yup.string().required('Old password required'),
                                userNewPassword: Yup.string().min(6, 'At least 6 characters').max(64, "Cannot exceed 64 characters").required('New password required'),
                                userConfirmPassword: Yup.string().required('Confirm password required').when("userNewPassword", {
                                    is: val => (val && val.length > 0 ? true : false),
                                    then: Yup.string().oneOf(
                                        [Yup.ref("userNewPassword")],
                                        "Both password need to be the same"
                                    )
                                })
                            })
                        }
                        enableReinitialize
                        onSubmit={handleChangePassword}
                    >
                        {({
                            errors,
                            handleBlur,
                            handleSubmit,
                            touched,
                            values,
                            isSubmitting
                        }) => (
                            <form onSubmit={handleSubmit}>
                                <Box mt={0}>
                                    <Card>
                                        <CardHeader
                                            title={cardTitle("Change Password")}
                                        />
                                        <Divider />
                                        <CardContent>
                                            <Grid container className={classes.row} spacing={1}>
                                                <Grid item md={3} xs={12}>
                                                    <InputLabel shrink id="userName">
                                                        User Name *
                                                    </InputLabel>
                                                    <TextField
                                                        error={Boolean(touched.userName && errors.userName)}
                                                        fullWidth
                                                        helperText={touched.userName && errors.userName}
                                                        name="userName"
                                                        onChange={(e) => {
                                                            handleChange1(e)
                                                        }}
                                                        value={FormDetails.userName}
                                                        variant="outlined"
                                                        id="userName"
                                                        disabled={true}
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item md={3} xs={12}>
                                                    <InputLabel shrink id="userOldPassword">
                                                        Old Password *
                                                    </InputLabel>
                                                    <TextField
                                                        error={Boolean(touched.userOldPassword && errors.userOldPassword)}
                                                        fullWidth
                                                        helperText={touched.userOldPassword && errors.userOldPassword}
                                                        name="userOldPassword"
                                                        onChange={(e) => {
                                                            handleChange1(e)
                                                        }}
                                                        value={FormDetails.userOldPassword}
                                                        variant="outlined"
                                                        id="userOldPassword"
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item md={3} xs={12}>
                                                    <InputLabel shrink id="userNewPassword">
                                                        New Password *
                                                    </InputLabel>
                                                    <TextField
                                                        error={Boolean(touched.userNewPassword && errors.userNewPassword)}
                                                        fullWidth
                                                        helperText={touched.userNewPassword && errors.userNewPassword}
                                                        name="userNewPassword"
                                                        onChange={(e) => {
                                                            handleChange1(e)
                                                        }}
                                                        value={FormDetails.userNewPassword}
                                                        variant="outlined"
                                                        id="userNewPassword"
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item md={3} xs={12}>
                                                    <InputLabel shrink id="userConfirmPassword">
                                                        Confirm Password *
                                                    </InputLabel>
                                                    <TextField
                                                        error={Boolean(touched.userConfirmPassword && errors.userConfirmPassword)}
                                                        fullWidth
                                                        helperText={touched.userConfirmPassword && errors.userConfirmPassword}
                                                        name="userConfirmPassword"
                                                        onChange={(e) => {
                                                            handleChange1(e)
                                                        }}
                                                        value={FormDetails.userConfirmPassword}
                                                        variant="outlined"
                                                        id="userConfirmPassword"
                                                        size="small"
                                                    />
                                                </Grid>
                                            </Grid>
                                            <Box display="flex" justifyContent="flex-end" p={2}>
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    variant="contained"
                                                    size="small"
                                                    disabled={SubmitDisable}
                                                >
                                                    Change Password
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </form>
                        )}
                    </Formik>
                </Container>
            </Page>
        </Fragment >
    );
};
