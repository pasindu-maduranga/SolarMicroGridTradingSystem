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
import { trackPromise } from 'react-promise-tracker';
import { LoadingComponent } from '../../../../../utils/newLoader';
import { useAlert } from "react-alert";
import services from 'src/views/UserManagement/ScreenManager/Services';
import MaterialTable from "material-table";

const materialIcons = [
  "dashboard", "people", "code", "settings", "person", "security", "desktop_windows",
  "home", "star", "list", "check", "close", "arrow_drop_down", "info", "help",
  "add", "edit", "delete", "save", "search", "menu", "warning", "error", "success",
  "assignment", "build", "camera", "description", "event", "favorite", "group", "lock"
];

export function ParentMenuConfig() {
  const alert = useAlert();

  const [parentMenuList, setParentMenuList] = useState([]);
  const [parentMenuFormData, setParentMenuFormData] = useState({
    parentMenuName: "",
    iconTagName: "",
    menuOrderNumber: 0
  });

  useEffect(() => {
    trackPromise(getAllParentMenus());
  }, []);

  async function getAllParentMenus() {
    let response = await services.GetAllParentMenuDetails();
    if (response.statusCode === "Success") {
      setParentMenuList(response.data);
    }
  }

  async function saveParentMenuDetails() {
    let requestModel = {
      parentMenuName: parentMenuFormData.parentMenuName,
      iconTag: parentMenuFormData.iconTagName.toLocaleLowerCase(),
      menuOrderNo: parentMenuFormData.menuOrderNumber
    };
    let response = await services.SaveParentMenuDetails(requestModel);
    if (response.statusCode === "Success") {
      alert.success(response.message);
      setParentMenuFormData({ parentMenuName: "", iconTagName: "", menuOrderNumber: 0 });
      trackPromise(getAllParentMenus());
    } else {
      alert.error(response.message);
    }
  }

  function handleChange(e) {
    const target = e.target;
    const value = target.value;
    setParentMenuFormData({
      ...parentMenuFormData,
      [e.target.name]: value
    });
  }

  return (
    <Fragment>
      <LoadingComponent />
      <Page title="Parent Menu">
        <Container>
          <Box mt={2}>
            <Card>
              <CardHeader title="Parent Menu" />
              <PerfectScrollbar>
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="parentMenuName">
                        Parent Menu Name
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="parentMenuName"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={parentMenuFormData.parentMenuName}
                        variant="outlined"
                        id="parentMenuName"
                      />
                    </Grid>
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="iconTagName">
                        Icon Tag Name
                      </InputLabel>
                      <Autocomplete
                        id="iconTagName"
                        options={materialIcons}
                        getOptionLabel={(option) => option}
                        value={parentMenuFormData.iconTagName}
                        onChange={(event, newValue) => {
                          setParentMenuFormData({
                            ...parentMenuFormData,
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
                    <Grid item md={4} xs={12}>
                      <InputLabel shrink id="menuOrderNumber">
                        Menu Order
                      </InputLabel>
                      <TextField
                        fullWidth
                        name="menuOrderNumber"
                        onChange={(e) => handleChange(e)}
                        size='small'
                        value={parentMenuFormData.menuOrderNumber}
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
                    onClick={() => trackPromise(saveParentMenuDetails())}
                    size='small'
                  >
                    Save Parent Menu
                  </Button>
                </Box>

                <Box minWidth={1000}>
                  <MaterialTable
                    title="Existing Parent Menus"
                    columns={[
                      { title: 'Order', field: 'menuOrderNo' },
                      { title: 'Name', field: 'parentMenuName' },
                      { title: 'Icon', field: 'iconTag' }
                    ]}
                    data={parentMenuList}
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
