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
  Icon,
  MenuItem
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Page from 'src/components/Page';
import services from '../../Services';
import { useAlert } from "react-alert";
import { trackPromise } from 'react-promise-tracker';
import { LoadingComponent } from '../../../../../utils/newLoader';
import MaterialTable from "material-table";

const materialIcons = [
  "dashboard", "people", "code", "settings", "person", "security", "desktop_windows",
  "home", "star", "list", "check", "close", "arrow_drop_down", "info", "help",
  "add", "edit", "delete", "save", "search", "menu", "warning", "error", "success",
  "assignment", "build", "camera", "description", "event", "favorite", "group", "lock"
];

export function MenuConfig() {
  const alert = useAlert();
  const [parentMenuList, setParentMenuList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [menuFormData, setMenuFormData] = useState({
    parentMenuID: 0,
    menuName: "",
    iconTagName: "",
    menuOrderNumber: 0
  });

  useEffect(() => {
    trackPromise(getAllParentMenuDetails());
    trackPromise(getAllMenuDetails());
  }, []);

  function generateDropDownMenu(data) {
    let items = [];
    if (data != null) {
      data.forEach(element => {
        items.push(<MenuItem key={element.parentMenuID} value={element.parentMenuID}>{element.parentMenuName}</MenuItem>);
      });
    }
    return items;
  }

  function parentMenuName(parentMenuID) {
    let found = parentMenuList.find(p => p.parentMenuID === parentMenuID);
    return found ? found.parentMenuName : "";
  }

  async function getAllParentMenuDetails() {
    let response = await services.GetAllParentMenuDetails();
    if (response.statusCode === "Success") {
      setParentMenuList(response.data);
    }
  }

  async function getAllMenuDetails() {
    let response = await services.GetAllMenuDetails();
    if (response.statusCode === "Success") {
      setMenuList(response.data);
    }
  }

  async function saveMenuDetails() {
    let requestModel = {
      parentMenuID: menuFormData.parentMenuID,
      menuName: menuFormData.menuName,
      iconTag: menuFormData.iconTagName.toLocaleLowerCase(),
      menuOrderNo: menuFormData.menuOrderNumber
    };
    let response = await services.SaveMenuDetails(requestModel);
    if (response.statusCode === "Success") {
      alert.success(response.message);
      setMenuFormData({ parentMenuID: 0, menuName: "", iconTagName: "", menuOrderNumber: 0 });
      trackPromise(getAllMenuDetails());
    } else {
      alert.error(response.message);
    }
  }

  function handleChange(e) {
    const target = e.target;
    const value = target.value;
    setMenuFormData({
      ...menuFormData,
      [e.target.name]: value
    });
  }

  return (
    <Fragment>
      <LoadingComponent />
      <Page title="Menu">
        <Container>
          <Box mt={2}>
            <Card>
              <CardHeader title="Menu" />
              <PerfectScrollbar>
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item md={3} xs={12}>
                      <InputLabel shrink id="parentMenuID">
                        Parent Menu
                      </InputLabel>
                      <TextField select
                        fullWidth
                        name="parentMenuID"
                        onChange={(e) => handleChange(e)}
                        value={menuFormData.parentMenuID}
                        variant="outlined"
                        id="parentMenuID"
                        size='small'
                      >
                        <MenuItem value="0">--Select Parent Menu--</MenuItem>
                        {generateDropDownMenu(parentMenuList)}
                      </TextField>
                    </Grid>
                    <Grid item md={3} xs={12}>
                      <InputLabel shrink id="menuName">
                        Menu Name
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="menuName"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={menuFormData.menuName}
                        variant="outlined"
                        id="menuName"
                      />
                    </Grid>
                    <Grid item md={3} xs={12}>
                      <InputLabel shrink id="iconTagName">
                        Icon Tag Name
                      </InputLabel>
                      <Autocomplete
                        id="iconTagName"
                        options={materialIcons}
                        getOptionLabel={(option) => option}
                        value={menuFormData.iconTagName}
                        onChange={(event, newValue) => {
                          setMenuFormData({
                            ...menuFormData,
                            iconTagName: newValue || ""
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
                      <InputLabel shrink id="menuOrderNumber">
                        Menu Order
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="menuOrderNumber"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={menuFormData.menuOrderNumber}
                        variant="outlined"
                        id="menuOrderNumber"
                        type="number"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
                <Box display="flex" justifyContent="flex-end" p={2}>
                  <Button
                    color="primary"
                    variant="outlined"
                    onClick={() => trackPromise(saveMenuDetails())}
                    size='small'
                  >
                    Save Menu
                  </Button>
                </Box>

                <Box minWidth={1000}>
                  <MaterialTable
                    title="Existing Menus"
                    columns={[
                      { title: 'Parent Menu', field: 'parentMenuID', render: rowData => parentMenuName(rowData.parentMenuID) },
                      { title: 'Order', field: 'menuOrderNo' },
                      { title: 'Name', field: 'menuName' },
                      { title: 'Icon', field: 'iconTag' }
                    ]}
                    data={menuList}
                    options={{
                      exportButton: false,
                      headerStyle: { textAlign: "left" },
                      cellStyle: { textAlign: "left" },
                      columnResizable: false
                    }}
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
