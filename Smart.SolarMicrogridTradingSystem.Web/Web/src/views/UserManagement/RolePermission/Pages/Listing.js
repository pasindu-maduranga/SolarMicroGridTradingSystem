import React, { useState, useEffect, Fragment } from 'react';
import { Button, Box, Grid, CardHeader, CardContent, Card, Divider, Typography, makeStyles, Container } from '@material-ui/core';
import PageHeader from 'src/views/Common/PageHeader';
import services from '../Services';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import StarIcon from '@material-ui/icons/Star';
import { Switch } from '@material-ui/core';
import { useAlert } from "react-alert";
import { LoadingComponent } from '../../../../utils/newLoader';
import Page from 'src/components/Page';
import { useNavigate, useParams } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import tokenService from '../../../../utils/tokenDecoder';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { groupBy } from 'lodash';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingBottom: theme.spacing(3),
    paddingTop: theme.spacing(3),
    width: '100%'
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
  },
  modernExpansion: {
    boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
    borderRadius: '8px !important',
    marginBottom: '8px',
    '&:before': {
      display: 'none',
    }
  },
  modernSwitchLabel: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    color: '#111827',
    marginLeft: '8px'
  }
}));
export default function PermissionListing() {
  const classes = useStyles();
  const title = "Change Role Permissions";
  const buttonName = "Save";
  const [permission, setPermission] = useState([]);
  const [screen, setScreen] = useState([]);
  const [ModifiedLeftList, setModifiedLeftList] = useState([])
  const [ModifiedRightList, setModifiedRightList] = useState([])
  const [unmodifiedPermission, setUnmodifiedPermission] = useState([]);
  const [updatingRoleID, setupdatingRoleID] = useState();
  const [clearPermission, setClearPermission] = useState({
    unmodifiedList: unmodifiedPermission,
    modifiedList: permission
  });
  const [isSaveDisable, setIsSaveDisable] = useState(false);
  const [isDataLoad, setDataLoadTrue] = useState(false);
  const [updatingRoleLevelID, setupUpdatingRoleLevelID] = useState();

  const alert = useAlert();
  const params = useParams();

  let decryptedRole = 0;
  let decryptedroleLevelID = 0;
  useEffect(() => {
    decryptedRole = atob(params.roleID.toString());
    decryptedroleLevelID = atob(params.roleLevelID.toString());
    if (decryptedRole != 0) {

      setupdatingRoleID(decryptedRole)
      setupUpdatingRoleLevelID(decryptedroleLevelID)

    }
  }, []);

  useEffect(() => {
    if (tokenService.getRoleLevelFromToken() != 1 && updatingRoleID == tokenService.getRoleIDFromToken()) {
      setIsSaveDisable(true);
    }
    else {
      setIsSaveDisable(false);
    }

    trackPromise(
      getAllPermission()
    )
  }, [updatingRoleID]);


  useEffect(() => {
    if (updatingRoleLevelID < tokenService.getRoleLevelFromToken()) {
      setIsSaveDisable(true);
    }
    else {
      setIsSaveDisable(false);
    }
  }, [updatingRoleLevelID]);


  useEffect(() => {
    if (permission.length > 0) {
      sortArrayList(screen)
    }
  }, [permission])

  const navigate = useNavigate();
  const handleClick = () => {
    navigate('/app/roles/listing');
  }

  function handlePermissionChange(permissionID, screenID) {
    var modifiedPermission = [...permission];
    modifiedPermission.forEach(p => {
      if (p.permissionID == permissionID) {
        p.isAssigned = !p.isAssigned
      }
    });
    setPermission(modifiedPermission);

    var count = 0;
    var trueCount = 0;
    var updateCount = [...permission];
    updateCount.forEach(p => {
      if (p.screenID == screenID) {
        count++;
        if (p.isAssigned == true) {
          trueCount++;
        }
      }
    });
    setPermission(updateCount);

    var updateScreen = [...screen];
    updateScreen.forEach(s => {
      if (s.screenID == screenID) {
        if (trueCount == count) {
          s.isOpen = true;
        } else {
          s.isOpen = false;
        }
      }
    });
    setScreen(updateScreen);
  }

  function handleAllSelectByParentMenuID(menuID) {
    var updateScreen = [...screen];

    const selectedScreenCount = updateScreen.reduce((counter, obj) => {
      if (obj.parentMenuID === menuID) counter += 1
      return counter;
    }, 0);

    const selectedOpenedScreenCount = updateScreen.reduce((counter, obj) => {
      if (obj.parentMenuID === menuID && obj.isOpen === true) counter += 1
      return counter;
    }, 0);

    updateScreen.forEach(s => {
      if (s.parentMenuID == menuID) {
        if (selectedScreenCount === selectedOpenedScreenCount) {
          s.isOpen = false;
          s.isParentMenuOpen = false
        } else {
          s.isOpen = true;
          s.isParentMenuOpen = true
        }
      }
    });
    setScreen(updateScreen);
    sortArrayList(updateScreen)
    var checkAllScreen = [...screen];
    checkAllScreen.forEach(s => {
      if (s.parentMenuID == menuID) {
        if (s.isOpen) {
          var updateCount = [...permission];
          updateCount.forEach(p => {
            if (p.screenID == s.screenID) {
              p.isAssigned = true;
            }
          });
          setPermission(updateCount);
        } else {
          var permissionList = [...permission];
          permissionList.forEach(p => {
            if (p.screenID == s.screenID) {
              p.isAssigned = false;
            }
          })
          setPermission(permissionList);
        }
      }
    });
  }

  function handleScreenChange(screenID) {
    var updateScreen = [...screen];
    updateScreen.forEach(s => {
      if (s.screenID == screenID) {
        s.isOpen = !s.isOpen;
      }
    });
    setScreen(updateScreen);

    var checkAllScreen = [...screen];
    checkAllScreen.forEach(s => {
      if (s.screenID == screenID) {
        if (s.isOpen) {
          var updateCount = [...permission];
          updateCount.forEach(p => {
            if (p.screenID == screenID) {
              p.isAssigned = true;
            }
          });
          setPermission(updateCount);
        } else {
          var permissionList = [...permission];
          permissionList.forEach(p => {
            if (p.screenID == screenID) {
              p.isAssigned = false;
            }
          })
          setPermission(permissionList);
        }
      }
    });
  }

  function handleClickCheckboxByParentMenuID(e) {
    e.stopPropagation();
  }

  function handleClickCheckbox(e) {
    e.stopPropagation();
  }

  async function getAllPermission() {
    var permissionData = await services.getPermissionNameAndScreenNameForCheckbox(tokenService.getRoleIDFromToken(), updatingRoleID);

    sortArrayList(permissionData.data.screens);
    setScreen(permissionData.data.screens);
    setPermission(permissionData.data.permissions);
    setUnmodifiedPermission(permissionData.data.unmodifiedPermissions);

    if (permissionData.data.screens.length > 0) {
      setDataLoadTrue(true)
    }
  }

  function sortArrayList(data) {
    if (data.length <= 0) {
      return;
    }

    const groupByReferenceNumber = groupBy(data, "parentMenuName");
    const sortedObjectList = Object.entries(groupByReferenceNumber).map(([key, value]) => ({
      screenName: key,
      valueList: value,
      parentMenuID: value[0].parentMenuID,
      isParentMenuOpen: (!value.some(e => e.isOpen === false))
    }));

    var arr = sortedObjectList;
    arr.sort(function (a, b) {
      return a.valueList.length - b.valueList.length;
    });

    let leftArray = [];
    let tempRightArray = [];

    for (let index = 0; index < arr.length; index++) {

      let tempObject = arr[index]

      if (index % 2) {
        tempObject['side'] = "left"
        leftArray.push(tempObject)
      } else {
        tempObject['side'] = "right"
        tempRightArray.push(arr[index])
      }

    }

    var rightArray = tempRightArray.reverse();
    setModifiedLeftList(leftArray)
    setModifiedRightList(rightArray)
  }

  async function handleSave(e) {

    e.preventDefault();
    setIsSaveDisable(true)

    const response = await services.saveRolePermission(unmodifiedPermission, permission, updatingRoleID)

    alert.success(response.message);
    afterSuccessfulyChanged(response.statusCode);
  }

  function afterSuccessfulyChanged(response) {
    if (response === "Success") {
      clearState()
      setTimeout(() => {
        navigate('/app/roles/listing');
      }, 3000);
    }
  }

  function clearState() {
    setClearPermission({
      ...clearPermission,
      unmodifiedList: null,
      modifiedList: null,
      roleID: null
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

  return (
    <Fragment>
      <LoadingComponent />
      <Page className={classes.root} title={title}>
        <Container maxWidth={false}>
          <Box mt={0}>
            <Card className={classes.modernCard}>
              <CardHeader
                title={cardTitle("Role Permission")}
              />
              <PerfectScrollbar>
                <Divider />
                <CardContent>
                  <form onSubmit={(e) => handleSave(e)}>
                    <div>
                      <div >

                        <Grid container spacing={1}>
                          <Grid item md={6} xs={12}>
                            <Grid container spacing={1}>
                              {
                                ModifiedLeftList.map((s, index) => (
                                  <Grid item md={12} xs={12}>
                                    <ExpansionPanel className={classes.modernExpansion}>
                                      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography className={classes.heading} >
                                          <Switch
                                            color="primary"
                                            onChange={() => handleAllSelectByParentMenuID(s.parentMenuID)}
                                            checked={s.isParentMenuOpen}
                                            onClick={e => handleClickCheckboxByParentMenuID(e)}
                                          />
                                          <label className={classes.modernSwitchLabel}>{s.screenName === undefined || s.screenName === "null" || s.screenName === isNaN ? "COMMON" : s.screenName}</label>
                                        </Typography>
                                      </ExpansionPanelSummary>
                                      <ExpansionPanelDetails>
                                        <Grid item md={12} xs={12}>
                                          {
                                            s.valueList.map(s => {
                                              return (
                                                <ExpansionPanel className={classes.modernExpansion}>
                                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography className={classes.heading} >
                                                      <Switch
                                                        color="primary"
                                                        onChange={() => handleScreenChange(s.screenID)}
                                                        checked={s.isOpen}
                                                        disabled={s.screenName === 'Role Permission'}
                                                        onClick={e => handleClickCheckbox(e)}
                                                      />
                                                      <label className={classes.modernSwitchLabel}>{s.screenName === undefined || s.screenName === "null" || s.screenName === isNaN ? "" : s.screenName}</label>
                                                    </Typography>
                                                  </ExpansionPanelSummary>
                                                  <ExpansionPanelDetails>
                                                    <Typography>
                                                      {permission.map(p => {
                                                        if (p.screenID == s.screenID) {
                                                          return (
                                                            <Fragment>
                                                              <ListItem button className={classes.nested}>
                                                                <ListItemIcon>
                                                                  <StarIcon />
                                                                </ListItemIcon>
                                                                <ListItemText primary={p.permissionName} />
                                                                <Switch
                                                                  color="primary"
                                                                  checked={p.isAssigned}
                                                                  disabled={s.screenName === 'Role Permission'}
                                                                  label={p.permissionName}
                                                                  onChange={() => handlePermissionChange(p.permissionID, p.screenID)}
                                                                />
                                                              </ListItem>
                                                            </Fragment>
                                                          );
                                                        }
                                                      })}
                                                    </Typography>
                                                  </ExpansionPanelDetails>
                                                </ExpansionPanel>
                                              );
                                            })
                                          }
                                        </Grid>
                                      </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                  </Grid>
                                ))
                              }
                            </Grid>
                          </Grid>
                          <Grid item md={6} xs={12}>
                            <Grid container spacing={1}>
                              {
                                ModifiedRightList.map((s, index) => (
                                  <Grid item md={12} xs={12}>
                                    <ExpansionPanel className={classes.modernExpansion}>
                                      <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography className={classes.heading} >
                                          <Switch
                                            color="primary"
                                            onChange={() => handleAllSelectByParentMenuID(s.parentMenuID)}
                                            checked={s.isParentMenuOpen}
                                            onClick={e => handleClickCheckboxByParentMenuID(e)}
                                          />
                                          <label className={classes.modernSwitchLabel}>{s.screenName === undefined || s.screenName === "null" || s.screenName === isNaN ? "COMMON" : s.screenName}</label>
                                        </Typography>
                                      </ExpansionPanelSummary>
                                      <ExpansionPanelDetails>
                                        <Grid item md={12} xs={12}>
                                          {
                                            s.valueList.map(s => {
                                              return (
                                                <ExpansionPanel className={classes.modernExpansion}>
                                                  <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Typography className={classes.heading} >
                                                      <Switch
                                                        color="primary"
                                                        onChange={() => handleScreenChange(s.screenID)}
                                                        checked={s.isOpen}
                                                        disabled={s.screenName === 'Role Permission'}
                                                        onClick={e => handleClickCheckbox(e)}
                                                      />
                                                      <label className={classes.modernSwitchLabel}>{s.screenName === undefined || s.screenName === "null" || s.screenName === isNaN ? "" : s.screenName}</label>
                                                    </Typography>
                                                  </ExpansionPanelSummary>
                                                  <ExpansionPanelDetails>
                                                    <Typography>
                                                      {permission.map(p => {
                                                        if (p.screenID == s.screenID) {
                                                          return (
                                                            <Fragment>
                                                              <ListItem button className={classes.nested}>
                                                                <ListItemIcon>
                                                                  <StarIcon />
                                                                </ListItemIcon>
                                                                <ListItemText primary={p.permissionName} />
                                                                <Switch
                                                                  color="primary"
                                                                  checked={p.isAssigned}
                                                                  disabled={s.screenName === 'Role Permission'}
                                                                  label={p.permissionName}
                                                                  onChange={() => handlePermissionChange(p.permissionID, p.screenID)}
                                                                />
                                                              </ListItem>
                                                            </Fragment>
                                                          );
                                                        }
                                                      })}
                                                    </Typography>
                                                  </ExpansionPanelDetails>
                                                </ExpansionPanel>
                                              );
                                            })
                                          }
                                        </Grid>
                                      </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                  </Grid>
                                ))
                              }
                            </Grid>
                          </Grid>
                        </Grid>
                      </div>
                    </div>
                    <Box display="flex" justifyContent="flex-end" p={2}>
                      {isDataLoad ? (
                        <Button
                          className={classes.modernButton}
                          style={{ backgroundColor: '#111827', color: '#FFF' }}
                          type="submit"
                          variant="contained"
                          disabled={isSaveDisable}
                        >
                          {buttonName}
                        </Button>
                      ) : null}
                    </Box>
                  </form>


                </CardContent>
              </PerfectScrollbar>
            </Card>
          </Box>
        </Container>
      </Page>
    </Fragment>

  );
};