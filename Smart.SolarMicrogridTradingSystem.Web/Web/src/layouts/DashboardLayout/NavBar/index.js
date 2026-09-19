import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { trackPromise } from 'react-promise-tracker';
import {
  Box,
  Divider,
  Drawer,
  Hidden,
  List,
  makeStyles,
  Tooltip,
  Typography
} from '@material-ui/core';

import tokenService from '../../../utils/tokenDecoder';
import { CommonGet } from '../../../helpers/HttpClient';
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Collapse from '@material-ui/core/Collapse';
import Icon from '@material-ui/core/Icon';
import { LoadingComponent } from 'src/utils/newLoader';
import sessionStorageReadWrite from 'src/utils/sessionStorageReadWrite';

const user = {
  avatar: '/static/images/avatars/avatar_6.png',
  jobTitle: 'Senior Developer',
  name: 'Katarina Smith'
};

const useStyles = makeStyles(() => ({
  mobileDrawer: {
    width: 275,
    backgroundColor: '#F9FAFB'
  },
  desktopDrawer: {
    width: 275,
    top: 70,
    height: 'calc(100% - 70px)',
    backgroundColor: '#F9FAFB',
    borderRight: '1px solid #E5E7EB'
  },
  avatar: {
    cursor: 'pointer',
    width: 64,
    height: 64
  },
  parentMainMenu: {
    backgroundColor: '#F9FAFB',
    width: 60,
    height: 'calc(100%)',
    borderRight: '1px solid #E5E7EB'
  },
  parentMainMenuList: {
  },
  menuList: {
    width: '100%',
    overflowY: 'scroll',
    overflowX: 'hidden',
    backgroundColor: '#F9FAFB'
  },
  elegantText: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#4B5563'
  },
  elegantSubText: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    fontSize: '0.85rem',
  },
  RootClass: {
    overflow: 'hidden',
    backgroundColor: '#F9FAFB'
  },
  activePill: {
    backgroundColor: '#54784D !important',
    color: '#ffffff !important',
    borderRadius: 8,
    margin: '4px 16px',
    width: 'auto',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    '& $elegantSubText': {
      color: '#ffffff !important'
    },
    '& .MuiListItemIcon-root .MuiIcon-root': {
      color: '#ffffff !important'
    }
  },
  inactivePill: {
    borderRadius: 8,
    margin: '4px 16px',
    width: 'auto',
    color: '#4B5563',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: '#E5E7EB !important',
      transform: 'translateX(4px)',
      color: '#111827 !important'
    }
  },
  menuItemHover: {
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: '#E5E7EB',
      transform: 'translateX(2px)'
    }
  }
}));

const NavBar = ({ onMobileClose, openMobile }) => {
  const classes = useStyles();
  const location = useLocation();
  const [mainNavigationMenu, setmainNavigationMenu] = useState([])
  const [activeMenuID, setActiveMenuID] = useState()
  const [parentMainMenuList, setParentMainMenuList] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const handleClick = (menuID) => {
    if (menuID == activeMenuID) {
      setActiveMenuID('0')
    } else {
      setActiveMenuID(menuID)
    }
  };

  const handleMainMenuClick = (mainMenuID) => {
    trackPromise(getMenuModelsByRole(mainMenuID))
    ClearScreenMemory();
    navigate('/app/dashboard')
  };

  const buttonProps = (value) => {
    let copyMainMenuList = [...mainNavigationMenu]

    let res = copyMainMenuList.filter(e => e.screenList.some(x => x.screenID === value))

    if (res !== null && res.length > 0) {
      sessionStorageReadWrite.setLastSelectedParentMenuIDFromSession(res[0].parentMenuID);
      sessionStorageReadWrite.setLastSelectedMainMenuIDFromSession(res[0].menuID);
      sessionStorageReadWrite.setLastSelectedScreenIDFromSession(value);
    }

    setSelectedIndex(value)
  };

  useEffect(() => {
    trackPromise(getParentMenuByRole())
    trackPromise(refreshIssue())
  }, []);

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (parentMainMenuList.length > 0) {
      let last_click_parent_menu_id = sessionStorageReadWrite.getLastSelectedParentMenuIDFromSession();
      let parentMenuID = last_click_parent_menu_id || "0";

      trackPromise(getMenuModelsByRole(parentMenuID !== "0" ? parentMenuID : parentMainMenuList[0].parentMenuID))
    }
  }, [parentMainMenuList]);

  async function refreshIssue() {
    let last_click_menu_id = sessionStorageReadWrite.getLastSelectedMainMenuIDFromSession();
    let last_click_screen_id = sessionStorageReadWrite.getLastSelectedScreenIDFromSession();

    setActiveMenuID(last_click_menu_id || "0");
    setSelectedIndex(last_click_screen_id || "0");
  }

  async function getMenuModelsByRole(mainMenuID) {
    const response = await CommonGet('/api/MainNavMenu/GetMenuModelsByRole', 'roleID=' + tokenService.getRoleIDFromToken() + '&mainMenuID=' + mainMenuID);
    setmainNavigationMenu(response.data)
  }

  async function getParentMenuByRole() {
    const response = await CommonGet('/api/ParentMainMenu/GetParentMenuByRole', 'roleID=' + tokenService.getRoleIDFromToken());
    setParentMainMenuList(response.data)
  }

  function ClearScreenMemory() {
    sessionStorageReadWrite.removeLastSelectedMainMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedParentMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedScreenIDFromSession();
    setSelectedIndex(0);
    setActiveMenuID('0');
  }

  const content = (
    <Box
      height="100%"
      display="flex"
      flexDirection="row"
      className={classes.RootClass}
    >
      <LoadingComponent />
      <Divider />
      <div className={classes.parentMainMenu} >
        <List className={classes.parentMainMenuList}>
          {parentMainMenuList.map((item) => (
            <ListItem
              style={{ color: '#4B5563', paddingBottom: 25, justifyContent: 'center', paddingLeft: 0, paddingRight: 0 }}
              button
              onClick={() => { handleMainMenuClick(item.parentMenuID) }}
              key={item.parentMenuID}
            >
              <Tooltip title={item.parentMenuName}>
                <ListItemIcon style={{ minWidth: 'auto', display: 'flex', justifyContent: 'center' }}>

                  <Icon style={{ fontSize: 24, color: '#111827' }} >{`${item.iconTag}`}</Icon>

                </ListItemIcon>
              </Tooltip>
            </ListItem>
          ))}
        </List>

      </div>
      <Box className={classes.menuList}>
        <List >
          {[...mainNavigationMenu].sort((a, b) => a.menuOrderNo - b.menuOrderNo).map((item) => (
            <div key={item.menuID}>

              {item.screenList != null ? (
                <div key={item.menuID}>


                  <ListItem
                    className={classes.menuItemHover}
                    style={{ color: '#111827' }}
                    button
                    onClick={() => { handleClick(item.menuID) }}
                    key={item.menuID}
                  >
                    <ListItemIcon >
                      <Icon style={{ fontSize: 20, color: '#111827' }} >{`${item.iconTag}`}</Icon>
                    </ListItemIcon>
                    <ListItemText disableTypography className={classes.elegantText}
                      primary={item.mainMenuName}
                    />
                    {item.menuID == activeMenuID ? (<ExpandLess style={{ color: '#111827' }} />) : (<ExpandMore style={{ color: '#111827' }} />)}
                  </ListItem>
                  <Collapse
                    key={"123"}
                    component="li"
                    in={item.menuID == activeMenuID}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List p={2}>
                      {[...item.screenList].sort((a, b) => a.screenOrderNo - b.screenOrderNo).map((sitem, i) => {
                        return (
                          <RouterLink key={i} to={sitem.routePath} aria-label="group" className="link" style={{ textDecoration: 'none' }}>
                            <ListItem
                              button
                              className={selectedIndex === sitem.screenID ? classes.activePill : classes.inactivePill}
                              onClick={() => buttonProps(sitem.screenID)}
                            >

                              <ListItemIcon style={{ minWidth: 36 }}>
                                <Icon style={{ fontSize: 18, color: selectedIndex === sitem.screenID ? '#ffffff' : '#111827' }} >{`${sitem.iconTag}`}</Icon>
                              </ListItemIcon>
                              <ListItemText disableTypography className={classes.elegantSubText}
                                primary={sitem.screenName}
                                style={{ color: selectedIndex === sitem.screenID ? '#ffffff' : '#111827' }}
                              />
                            </ListItem>
                          </RouterLink>
                        );
                      }
                      )}
                    </List>
                  </Collapse>

                </div>
              ) : (
                <div>
                  <RouterLink key={item.screenID} to={item.routePath} aria-label="group" className="link" style={{ textDecoration: 'none' }}>
                    <ListItem
                      button
                      className={selectedIndex === item.screenID ? classes.activePill : classes.inactivePill}
                      onClick={() => buttonProps(item.screenID)}
                    >
                      <ListItemIcon style={{ minWidth: 36 }}>
                        <Icon style={{ fontSize: 18, color: selectedIndex === item.screenID ? '#ffffff' : '#111827' }} >{`${item.iconTag}`}</Icon>
                      </ListItemIcon>
                      <ListItemText disableTypography className={classes.elegantSubText}
                        primary={item.screenName}
                        style={{ color: selectedIndex === item.screenID ? '#ffffff' : '#111827' }}
                      />
                    </ListItem>
                  </RouterLink>
                </div>

              )}

            </div>

          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      <Hidden lgUp>
        <Drawer
          anchor="left"
          classes={{ paper: classes.mobileDrawer }}
          onClose={onMobileClose}
          open={openMobile}
          variant="temporary"
        >
          {content}
        </Drawer>
      </Hidden>
      <Hidden mdDown>
        <Drawer
          anchor="left"
          classes={{ paper: classes.desktopDrawer }}
          open
          variant="persistent"
        >
          {content}
        </Drawer>
      </Hidden>
    </>
  );
};

NavBar.propTypes = {
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool
};

NavBar.defaultProps = {
  onMobileClose: () => { },
  openMobile: false
};

export default NavBar;
