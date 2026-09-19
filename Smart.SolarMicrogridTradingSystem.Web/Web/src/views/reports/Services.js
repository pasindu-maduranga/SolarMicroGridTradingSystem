import { CommonGet, CommonPost } from '../../helpers/HttpClient';

export default {
    GetCustomerCountDetailsforDashboardTiles,
    GetActiveCustomerCountDetailsforDashboardTiles,
    GetCropTotalforDashboardTiles,
    GetThisMonthCropTotalforDashboardTiles,
    GetLatestLoanDetailsforDashboard,
    GetLatestFactoryItemDetailsforDashboard,
    GetThisMonthLeafDetailsforDashboard,
    GetLast7DaysCropDetailsforDashboard
};

async function GetCustomerCountDetailsforDashboardTiles(groupID, factoryID) {
    let response = await CommonGet('/api/BLDashBoard/GetCustomerCountDetailsforDashboardTiles', "groupID=" + parseInt(groupID) + "&factoryID=" + parseInt(factoryID));
    return response.data;
  }

  async function GetActiveCustomerCountDetailsforDashboardTiles(bLDashboardInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetActiveCustomerCountDetailsforDashboardTiles', null, bLDashboardInputModel);
    return response;
  }

  async function GetCropTotalforDashboardTiles(bLDashboardInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetCropTotalforDashboardTiles', null, bLDashboardInputModel);
    return response;
  }

  async function GetThisMonthCropTotalforDashboardTiles(bLDashboardInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetThisMonthCropTotalforDashboardTiles', null, bLDashboardInputModel);
    return response;
  }

  async function GetLatestLoanDetailsforDashboard(bLDashboardLoandetailsInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetLatestLoanDetailsforDashboard', null, bLDashboardLoandetailsInputModel);
    return response;
  }

  async function GetLatestFactoryItemDetailsforDashboard(bLDashboardLoandetailsInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetLatestFactoryItemDetailsforDashboard', null, bLDashboardLoandetailsInputModel);
    return response;
  }

  async function GetThisMonthLeafDetailsforDashboard(bLDashboardInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetThisMonthLeafDetailsforDashboard', null, bLDashboardInputModel);
    return response.data;
  }

  async function GetLast7DaysCropDetailsforDashboard(bLDashboardLoandetailsInputModel) { 
    let response = await CommonPost('/api/BLDashBoard/GetLast7DaysCropDetailsforDashboard', null, bLDashboardLoandetailsInputModel);
    return response.data;
  }