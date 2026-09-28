import React, { useState, useEffect, Fragment } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  Grid,
  TextField,
  Container,
  Button,
  CardContent,
  Divider,
  InputLabel,
  CardHeader,
  Icon
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Page from 'src/components/Page';
import { useAlert } from "react-alert";
import { trackPromise } from 'react-promise-tracker';
import { LoadingComponent } from '../../../../../utils/newLoader';
import MenuItem from '@material-ui/core/MenuItem';
import Services from '../../Services';
import MaterialTable from "material-table";

const materialIcons = [
  "dashboard", "people", "code", "settings", "person", "security", "desktop_windows",
  "home", "star", "list", "check", "close", "arrow_drop_down", "info", "help",
  "add", "edit", "delete", "save", "search", "menu", "warning", "error", "success",
  "assignment", "build", "camera", "description", "event", "favorite", "group", "lock"
];

export function ScreenConfig() {
  const alert = useAlert();
  const [menuList, setMenuList] = useState([]);
  const [screenList, setScreenList] = useState([]);
  const [screenFormData, setScreenFormData] = useState({
    menuID: 0,
    screenCode: "",
    screenName: "",
    screenOrderNo: 0,
    iconTag: "",
    routePath: ""
  });
  const [screenDetailsList, setScreenDetailsList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    trackPromise(getAllMenuDetails());
    trackPromise(getAllScreenDetails());
  }, []);

  function generateDropDownMenu(data) {
    let items = [];
    if (data != null) {
      data.forEach(element => {
        items.push(<MenuItem key={element.menuID} value={element.menuID}>{element.menuName}</MenuItem>);
      });
    }
    return items;
  }

  async function saveScreenDetails() {
    let response = await Services.SaveScreenDetails(screenDetailsList);
    if (response.statusCode === "Success") {
      alert.success(response.message);
      setScreenDetailsList([]);
      trackPromise(getAllScreenDetails());
    } else {
      alert.error(response.message);
    }
  }

  async function addScreenDetails() {
    let model = {
      menuID: screenFormData.menuID,
      screenCode: screenFormData.screenCode.toLocaleUpperCase(),
      screenName: screenFormData.screenName,
      screenOrderNo: screenFormData.screenOrderNo,
      iconTag: screenFormData.iconTag.toLocaleLowerCase(),
      routePath: screenFormData.routePath
    };

    if (editingId) {
      let requestModel = {
        menuId: model.menuID,
        screenCode: model.screenCode,
        screenName: model.screenName,
        screenOrderNo: model.screenOrderNo,
        iconTag: model.iconTag,
        routePath: model.routePath
      };
      let response = await Services.UpdateScreenDetails(editingId, requestModel);
      if (response.statusCode === "Success") {
        alert.success(response.message);
        cancelEdit();
        trackPromise(getAllScreenDetails());
      } else {
        alert.error(response.message);
      }
      return;
    }

    setScreenDetailsList(result => [...result, model]);
  }

  function handleEdit(rowData) {
    setEditingId(rowData.screenID);
    setScreenFormData({
      menuID: rowData.menuID,
      screenCode: rowData.screenCode,
      screenName: rowData.screenName,
      screenOrderNo: rowData.screenOrderNo,
      iconTag: rowData.iconTag || "",
      routePath: rowData.routePath
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setScreenFormData({ menuID: 0, screenCode: "", screenName: "", screenOrderNo: 0, iconTag: "", routePath: "" });
  }

  async function handleDelete(rowData) {
    if (!window.confirm(`Remove screen "${rowData.screenName}"?`)) return;
    let response = await Services.DeleteMenuNode(rowData.screenID);
    if (response.statusCode === "Success") {
      alert.success(response.message);
      trackPromise(getAllScreenDetails());
    } else {
      alert.error(response.message);
    }
  }

  async function getAllMenuDetails() {
    let response = await Services.GetAllMenuDetails();
    if (response.statusCode === "Success") {
      setMenuList(response.data);
    }
  }

  async function getAllScreenDetails() {
    let response = await Services.GetAllScreenDetails();
    if (response.statusCode === "Success") {
      setScreenList(response.data);
    }
  }

  function handleChange(e) {
    const target = e.target;
    const value = target.value;
    setScreenFormData({
      ...screenFormData,
      [e.target.name]: value
    });
  }

  function menuNameFinder(menuID) {
    let found = menuList.find(x => x.menuID === menuID);
    return found ? found.menuName : "";
  }

  return (
    <Fragment>
      <LoadingComponent />
      <Page title="Screen">
        <Container>
          <Box mt={2}>
            <Card>
              <CardHeader title="Screen" />
              <PerfectScrollbar>
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="menuID">
                        Menu
                      </InputLabel>
                      <TextField select
                        fullWidth
                        name="menuID"
                        onChange={(e) => handleChange(e)}
                        value={screenFormData.menuID}
                        variant="outlined"
                        id="menuID"
                        size='small'
                      >
                        <MenuItem value="0">--Select Menu--</MenuItem>
                        {generateDropDownMenu(menuList)}
                      </TextField>
                    </Grid>
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="screenName">
                        Screen Name
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="screenName"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={screenFormData.screenName}
                        variant="outlined"
                        id="screenName"
                      />
                    </Grid>
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="screenCode">
                        Screen Code
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="screenCode"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={screenFormData.screenCode}
                        variant="outlined"
                        id="screenCode"
                        inputProps={{ style: { textTransform: "uppercase" } }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container spacing={3}>
                    <Grid item md={3} xs={12}>
                      <InputLabel shrink id="iconTag">
                        Icon Tag Name
                      </InputLabel>
                      <Autocomplete
                        id="iconTag"
                        options={materialIcons}
                        getOptionLabel={(option) => option}
                        value={screenFormData.iconTag}
                        onChange={(event, newValue) => {
                          setScreenFormData({
                            ...screenFormData,
                            iconTag: newValue || ""
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            size="small"
                            fullWidth
                          />
                        )}
                        renderOption={(option) => (
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <Icon style={{ marginRight: 8 }}>{option}</Icon>
                            {option}
                          </span>
                        )}
                      />
                    </Grid>
                    <Grid item md={3} xs={12}>
                      <InputLabel shrink id="screenOrderNo">
                        Screen Order
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="screenOrderNo"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={screenFormData.screenOrderNo}
                        variant="outlined"
                        id="screenOrderNo"
                        type="number"
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <InputLabel shrink id="routePath">
                        Route Path
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="routePath"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={screenFormData.routePath}
                        variant="outlined"
                        id="routePath"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <Box display="flex" justifyContent="flex-end" p={2} style={{ gap: 8 }}>
                  {editingId && (
                    <Button
                      variant="outlined"
                      onClick={cancelEdit}
                      size='small'
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => trackPromise(addScreenDetails())}
                    size='small'
                  >
                    {editingId ? 'Update Screen' : 'Add'}
                  </Button>
                </Box>

                <Box minWidth={1000}>
                  {screenDetailsList.length > 0 ?
                    <MaterialTable
                      title="Ready to save"
                      columns={[
                        { title: 'Menu', field: 'menuID', render: rowData => menuNameFinder(rowData.menuID) },
                        { title: 'Screen Code', field: 'screenCode' },
                        { title: 'Screen Name', field: 'screenName' },
                        { title: 'Order', field: 'screenOrderNo' },
                        { title: 'Icon', field: 'iconTag' },
                        { title: 'Route Path', field: 'routePath' }
                      ]}
                      data={screenDetailsList}
                      options={{
                        exportButton: false,
                        showTitle: true,
                        headerStyle: { textAlign: "left" },
                        cellStyle: { textAlign: "left" },
                        columnResizable: false,
                        actionsColumnIndex: -1
                      }}
                    /> : null}
                </Box>

                <Box display="flex" justifyContent="flex-end" p={2}>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => trackPromise(saveScreenDetails())}
                    size='small'
                    disabled={screenDetailsList.length === 0}
                  >
                    Save Screen Details
                  </Button>
                </Box>

                <Box minWidth={1000}>
                  <MaterialTable
                    title="Existing Screens"
                    columns={[
                      { title: 'Menu', field: 'menuID', render: rowData => menuNameFinder(rowData.menuID) },
                      { title: 'Screen Code', field: 'screenCode' },
                      { title: 'Screen Name', field: 'screenName' },
                      { title: 'Order', field: 'screenOrderNo' },
                      { title: 'Route Path', field: 'routePath' }
                    ]}
                    data={screenList}
                    options={{
                      exportButton: false,
                      headerStyle: { textAlign: "left" },
                      cellStyle: { textAlign: "left" },
                      columnResizable: false,
                      actionsColumnIndex: -1
                    }}
                    actions={[
                      {
                        icon: 'edit',
                        tooltip: 'Edit',
                        onClick: (event, rowData) => handleEdit(rowData)
                      },
                      {
                        icon: 'delete',
                        tooltip: 'Delete',
                        onClick: (event, rowData) => trackPromise(handleDelete(rowData))
                      }
                    ]}
                  />
                </Box>
              </PerfectScrollbar>
            </Card>
          </Box>
        </Container>
      </Page>
    </Fragment>
  );
};
