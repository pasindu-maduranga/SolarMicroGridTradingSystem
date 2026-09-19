import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Badge,
  Box,
  Hidden,
  IconButton,
  Toolbar,
  Button,
  makeStyles,
  Avatar,
  Typography,
  withStyles,
  Tooltip,
  Grid
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import NotificationsIcon from '@material-ui/icons/NotificationsOutlined';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import Brightness4OutlinedIcon from '@material-ui/icons/Brightness4Outlined';
import SearchIcon from '@material-ui/icons/Search';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import Logo from 'src/components/Logo';
import Popover from '@material-ui/core/Popover';
import InputBase from '@material-ui/core/InputBase';
import tokenService from '../../utils/tokenDecoder';
import { Offline, Online, Detector } from "react-detect-offline"
import WifiIcon from '@material-ui/icons/Wifi';
import RssFeedIcon from '@material-ui/icons/RssFeed';
import sessionStorageReadWrite from 'src/utils/sessionStorageReadWrite'
import { AlertDialog } from 'src/views/Common/AlertDialog';
import webConfigurationRead from 'src/utils/webConfigurationRead';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: '#ffffff',
    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
    height: 70,
    display: 'flex',
    justifyContent: 'center',
    zIndex: theme.zIndex.drawer + 1
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    background: '#F3F4F6',
    borderRadius: 24,
    border: 'none',
    padding: '6px 16px',
    width: 400,
    color: '#4B5563',
    margin: '0 auto',
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    marginLeft: 8,
    fontSize: '0.9rem',
    fontFamily: '"Inter", sans-serif',
    '&::placeholder': {
      color: '#9CA3AF'
    }
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 42,
    height: 42,
    border: '2px solid rgba(0, 0, 0, 0.1)',
  },
  onlineBadge: {
    backgroundColor: '#4caf50',
    width: 10,
    height: 10,
    borderRadius: '50%',
    position: 'absolute',
    bottom: 0,
    right: 0,
    border: '2px solid #1b5e20'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: 25,
  },
  nameText: {
    fontWeight: 600,
    color: '#111827',
    fontSize: '0.95rem',
    lineHeight: 1.2
  },
  jobBadge: {
    background: '#f3f4f6',
    color: '#111827',
    fontSize: '0.65rem',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 10,
    marginTop: 2
  },
  iconButton: {
    marginLeft: 8,
    color: '#6b7280',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: '#111827',
      transform: 'scale(1.05)'
    }
  }
}));

const TopBar = ({
  className,
  onMobileNavOpen,
  ...rest
}) => {
  const classes = useStyles();
  const [notifications] = useState([]);

  const [userName, setUserName] = useState()
  const [roleName, setRoleName] = useState()
  const [message, setMessage] = useState('Logout Confirmation AgriGEN');
  const [EnableConfirmMessage, setEnableConfirmMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPopUp, setconfirmPopUp] = useState();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  const [ConnectionCheckConfiguration, setConnectionCheckConfiguration] = useState({
    isEnabled: true,
    interval: 5000,
    timeout: 5000
  })
  const navigate = useNavigate();

  const logout = async (values) => {
    ClearAllSessionStorageItems();
    window.location.href = '/signin';
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePasswordChange = (event) => {
    let encryptedUserID = btoa(tokenService.getUserIDFromToken().toString())
    navigate("/app/users/changeUserPassword/" + encryptedUserID)
    setAnchorEl(false);
  }

  useEffect(() => {
    setUserName(tokenService.getUserNameFromToken())
    setRoleName(tokenService.getRoleNameFromToken())
  }, []);

  const user = {
    //avatar: '/static/images/not_found.png',
    jobTitle: roleName,
    name: userName
  };

  function ClearAllSessionStorageItems() {
    sessionStorageReadWrite.removeTokenFromSession();
    sessionStorageReadWrite.removeLastSelectedMainMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedParentMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedScreenIDFromSession();
  }

  function confirmData(y) {
    if (y) {
      logout(confirmPopUp);
    }
  }

  async function confirmMessage(data) {
    setIsLoading(true);
    setEnableConfirmMessage(true);
    setconfirmPopUp(data);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }

  useEffect(() => {
    GetConnectionCheckConfigDetails()
  }, [])


  async function GetConnectionCheckConfigDetails() {
    const response = await webConfigurationRead.ReadConnectionCheckConfig();
    if (response != null && response != undefined) {
      setConnectionCheckConfiguration(response);
    }
  }

  return (
    <AppBar
      className={clsx(classes.root, className)}
      elevation={0}
      {...rest}
    >
      <Toolbar>

        <Hidden mdDown>
          <RouterLink to="/">
            <Logo />
          </RouterLink>
          <Box flexGrow={1} />
          <Box className={classes.searchBar}>
            <SearchIcon style={{ color: '#9CA3AF' }} />
            <InputBase
              placeholder="Search crops, livestock, staff..."
              className={classes.searchInput}
            />
          </Box>
          <Box flexGrow={1} />

          {/* Icons Section */}
          <Box display="flex" alignItems="center" mr={2}>
            <IconButton className={classes.iconButton}>
              <Brightness4OutlinedIcon />
            </IconButton>
            
            <IconButton className={classes.iconButton}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton className={classes.iconButton}>
              <SettingsOutlinedIcon />
            </IconButton>

            <Tooltip title="Sign out">
              <IconButton className={classes.iconButton} onClick={logout}>
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* User Info Section */}
          <Box display="flex" alignItems="center" style={{ borderLeft: '1px solid #E5E7EB', paddingLeft: 16 }}>
            <Box className={classes.avatarContainer}>
              <Avatar
                className={classes.avatar}
                src={user.avatar}
                style={{ cursor: 'pointer', backgroundColor: '#E8F0E6', color: '#54784D', fontWeight: 600 }}
                onClick={handleClick}
              >A</Avatar>
              <Box className={classes.onlineBadge} style={{ backgroundColor: '#22C55E', border: '2px solid #fff' }} />
            </Box>

            <Box className={classes.userInfo} style={{ marginRight: 0 }}>
              <Typography className={classes.nameText}>
                {user.name}
              </Typography>
              <Box className={classes.jobBadge} style={{ padding: 0, background: 'transparent' }}>
                {user.jobTitle}
              </Box>
            </Box>

            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Button color="primary" onClick={handlePasswordChange}>Change Password</Button>
            </Popover>
          </Box>
        </Hidden>
      <Hidden lgUp>
        <IconButton
          color="primary"
          onClick={onMobileNavOpen} >
          <MenuIcon />
        </IconButton>
        <RouterLink to="/">
          <Logo />
        </RouterLink>
        <Box flexGrow={1} />
        <Box className={classes.userInfo}>
          <Typography className={classes.nameText}>
            {user.name}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Avatar
            className={classes.avatar}
            component={RouterLink}
            src={user.avatar}
            to="/app/account"
          />
        </Box>
        <IconButton className={classes.iconButton} onClick={logout}>
          <ExitToAppIcon />
        </IconButton>

      </Hidden>
    </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func
};

export default TopBar;