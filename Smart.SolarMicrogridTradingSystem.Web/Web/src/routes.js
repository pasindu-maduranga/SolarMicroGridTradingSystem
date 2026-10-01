import React from 'react';
import { Navigate } from 'react-router-dom';
import Loader from 'src/utils/Loader';
import DashboardLayout from 'src/layouts/DashboardLayout';
import AccountView from 'src/views/account/AccountView';
import DashboardView from 'src/views/reports/DashboardView';
import LoginView from 'src/views/auth/LoginView';
import NotFoundView from 'src/views/errors/NotFoundView';
import RegisterView from 'src/views/auth/RegisterView';
import SettingsView from 'src/views/settings/SettingsView';
import UserListing from 'src/views/UserManagement/User/Pages/Listing';
import UserAddEdit from 'src/views/UserManagement/User/Pages/AddEdit';
import PasswordChange from 'src/views/UserManagement/User/Pages/PasswordChange';
import ChangeUserPassword from 'src/views/UserManagement/User/Pages/ChangePasswordByUser';
import PermissionListing from 'src/views/UserManagement/RolePermission/Pages/Listing';
import RoleAddEdit from 'src/views/UserManagement/Role/Pages/AddEdit';
import RoleListing from 'src/views/UserManagement/Role/Pages/Listing';
import ScreenManagerAddEdit from 'src/views/UserManagement/ScreenManager/Pages/AddEdit';
import NodeListing from 'src/views/MicrogridNodeManagement/Pages/Listing';
import NodeAddEdit from 'src/views/MicrogridNodeManagement/Pages/AddEdit';
import GridOperatorMapping from 'src/views/MicrogridNodeManagement/Pages/GridOperatorMapping';
import SlotsOverview from 'src/views/MicrogridNodeManagement/Pages/SlotsOverview';
import SlotsDetail from 'src/views/MicrogridNodeManagement/Pages/SlotsDetail';
import ProsumerApprovals from 'src/views/ProsumerManagement/Pages/Approvals';
import ProsumerListing from 'src/views/ProsumerManagement/Pages/Listing';
import ProsumerAddEdit from 'src/views/ProsumerManagement/Pages/AddEdit';
import ReservationsListing from 'src/views/Reservations/Pages/Listing';
import ReservationAddEdit from 'src/views/Reservations/Pages/AddEdit';
import Unauthorized from './utils/unauthorized';

const routes = (isLoggedIn) => [
  {
    path: 'app',
    element: isLoggedIn ? <DashboardLayout /> : <Navigate to="/signin" />,
    children: [
      { path: 'account', element: <AccountView /> },
      { path: 'dashboard', element: <DashboardView /> },
      { path: 'settings', element: <SettingsView /> },
      { path: '*', element: <Navigate to="/404" /> },
      {
        path: 'users',
        children: [
          { path: 'listing', element: <UserListing /> },
          { path: 'addEdit/:userID', element: <UserAddEdit /> },
          { path: 'passwordChange/:userID', element: <PasswordChange /> },
          { path: 'changeUserPassword/:userID', element: <ChangeUserPassword /> }
        ]
      },
      {
        path: 'roles',
        children: [
          { path: 'listing', element: <RoleListing /> },
          { path: 'addEdit/:roleID', element: <RoleAddEdit /> }
        ]
      },
      {
        path: 'rolePermission',
        children: [
          { path: 'listing/:roleID/:roleLevelID', element: <PermissionListing /> }
        ]
      },
      {
        path: 'screenManager',
        children: [
          { path: 'listing', element: <ScreenManagerAddEdit /> }
        ]
      },
      {
        path: 'nodes',
        children: [
          { path: 'listing', element: <NodeListing /> },
          { path: 'addEdit/:nodeID', element: <NodeAddEdit /> },
          { path: 'gridOperatorMapping', element: <GridOperatorMapping /> },
          { path: 'slots', element: <SlotsOverview /> },
          { path: 'slots/:nodeID', element: <SlotsDetail /> }
        ]
      },
      {
        path: 'prosumers',
        children: [
          { path: 'profiles', element: <ProsumerListing /> },
          { path: 'addEdit', element: <ProsumerAddEdit /> },
          { path: 'approvals', element: <ProsumerApprovals /> }
        ]
      },
      {
        path: 'reservations',
        children: [
          { path: 'listing', element: <ReservationsListing /> },
          { path: 'addEdit/:reservationID', element: <ReservationAddEdit /> }
        ]
      }
    ]
  },
  {
    path: '/',
    children: [
      { path: 'loader', element: <Loader /> },
      { path: 'signin', element: <LoginView /> },
      { path: 'register', element: <RegisterView /> },
      { path: '404', element: <NotFoundView /> },
      { path: 'unauthorized', element: <Unauthorized /> },
      { path: '/', element: <Navigate to="/app/dashboard" /> },
      { path: '*', element: <Navigate to="/404" /> }
    ]
  }
];

export default routes;
