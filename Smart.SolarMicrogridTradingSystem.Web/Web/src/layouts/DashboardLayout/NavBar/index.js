import React, { useEffect, useState, Fragment } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { trackPromise } from 'react-promise-tracker';
import { Dialog, Disclosure, Transition } from '@headlessui/react';

import tokenService from '../../../utils/tokenDecoder';
import { CommonGet } from '../../../helpers/HttpClient';
import { LoadingComponent } from 'src/utils/newLoader';
import sessionStorageReadWrite from 'src/utils/sessionStorageReadWrite';
import { useSidebar } from '../SidebarContext';

const RailIcon = ({ tag, size = 22 }) => (
  <span className="material-icons select-none" style={{ fontSize: size }}>{tag}</span>
);

const SidebarBody = ({
  parentMainMenuList,
  activeParentMenuID,
  panelOpen,
  mainNavigationMenu,
  activeMenuID,
  selectedIndex,
  handleMainMenuClick,
  handleClick,
  buttonProps
}) => (
  <div className="flex h-full">
    {/* PARENT RAIL */}
    <div className="w-16 flex-shrink-0 flex flex-col items-center gap-2 py-4 bg-[#FAFAF8] border-r border-[#EFEFEF]">
      {parentMainMenuList.map((item) => {
        const isActive = item.parentMenuID === activeParentMenuID && panelOpen;
        return (
          <button
            key={item.parentMenuID}
            type="button"
            title={item.parentMenuName}
            onClick={() => handleMainMenuClick(item.parentMenuID)}
            className={
              'w-11 h-11 rounded-xl flex items-center justify-center transition-colors ' +
              (isActive
                ? 'bg-[#FFE9A8] text-[#5C3D0E]'
                : 'text-[#726A58] hover:bg-[#FFF3D6] hover:text-[#5C3D0E]')
            }
          >
            <RailIcon tag={item.iconTag} />
          </button>
        );
      })}
    </div>

    {/* MENU PANEL */}
    {panelOpen && (
    <div className="flex-1 min-w-0 overflow-y-auto py-4 px-2">
        {[...mainNavigationMenu]
          .sort((a, b) => a.menuOrderNo - b.menuOrderNo)
          .map((item) =>
            item.screenList != null ? (
              <Disclosure key={item.menuID} defaultOpen={item.menuID === activeMenuID}>
                {() => (
                  <div className="mb-1">
                    <button
                      type="button"
                      onClick={() => handleClick(item.menuID)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5C3D0E] hover:bg-[#FFEFCC] transition-colors text-left"
                    >
                      <RailIcon tag={item.iconTag} size={19} />
                      <span className="flex-1 text-sm font-semibold">{item.mainMenuName}</span>
                      <svg
                        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform ${item.menuID === activeMenuID ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {item.menuID === activeMenuID && (
                      <div className="flex flex-col mt-1 pl-4">
                        {[...item.screenList]
                          .sort((a, b) => a.screenOrderNo - b.screenOrderNo)
                          .map((sitem, i) => (
                            <RouterLink
                              key={i}
                              to={sitem.routePath}
                              onClick={() => buttonProps(sitem.screenID)}
                              className={
                                'flex items-center gap-3 px-3 py-2 my-0.5 rounded-lg text-sm no-underline transition-colors ' +
                                (selectedIndex === sitem.screenID
                                  ? 'bg-gradient-to-r from-[#F5A623] to-[#E8A53A] text-[#2A1B00] font-semibold shadow-sm'
                                  : 'text-[#6B4E1E] hover:bg-[#FFF3D6]')
                              }
                            >
                              <RailIcon tag={sitem.iconTag} size={17} />
                              <span>{sitem.screenName}</span>
                            </RouterLink>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>
            ) : (
              <RouterLink
                key={item.screenID}
                to={item.routePath}
                onClick={() => buttonProps(item.screenID)}
                className={
                  'flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-sm no-underline transition-colors ' +
                  (selectedIndex === item.screenID
                    ? 'bg-gradient-to-r from-[#F5A623] to-[#E8A53A] text-[#2A1B00] font-semibold shadow-sm'
                    : 'text-[#5C3D0E] hover:bg-[#FFEFCC]')
                }
              >
                <RailIcon tag={item.iconTag} size={19} />
                <span>{item.screenName}</span>
              </RouterLink>
            )
          )}
    </div>
    )}
  </div>
);

const NavBar = () => {
  const location = useLocation();
  const { mobileOpen, closeMobile, panelOpen, setPanelOpen } = useSidebar();
  const [mainNavigationMenu, setmainNavigationMenu] = useState([]);
  const [activeMenuID, setActiveMenuID] = useState();
  const [parentMainMenuList, setParentMainMenuList] = useState([]);
  const [activeParentMenuID, setActiveParentMenuID] = useState();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const handleClick = (menuID) => {
    if (menuID == activeMenuID) {
      setActiveMenuID('0');
    } else {
      setActiveMenuID(menuID);
    }
  };

  const handleMainMenuClick = (mainMenuID) => {
    if (mainMenuID === activeParentMenuID && panelOpen) {
      setPanelOpen(false);
      return;
    }
    setActiveParentMenuID(mainMenuID);
    setPanelOpen(true);
    trackPromise(getMenuModelsByRole(mainMenuID));
    ClearScreenMemory();
    navigate('/app/dashboard');
  };

  const buttonProps = (value) => {
    let copyMainMenuList = [...mainNavigationMenu];
    let res = copyMainMenuList.filter((e) => e.screenList.some((x) => x.screenID === value));
    if (res !== null && res.length > 0) {
      sessionStorageReadWrite.setLastSelectedParentMenuIDFromSession(res[0].parentMenuID);
      sessionStorageReadWrite.setLastSelectedMainMenuIDFromSession(res[0].menuID);
      sessionStorageReadWrite.setLastSelectedScreenIDFromSession(value);
    }
    setSelectedIndex(value);
  };

  useEffect(() => {
    trackPromise(getParentMenuByRole());
    trackPromise(refreshIssue());
  }, []);

  useEffect(() => {
    closeMobile();
  }, [location.pathname]);

  useEffect(() => {
    if (parentMainMenuList.length > 0) {
      let last_click_parent_menu_id = sessionStorageReadWrite.getLastSelectedParentMenuIDFromSession();
      let parentMenuID = last_click_parent_menu_id || '0';
      let resolvedParentMenuID = parentMenuID !== '0' ? parentMenuID : parentMainMenuList[0].parentMenuID;
      setActiveParentMenuID(resolvedParentMenuID);
      trackPromise(getMenuModelsByRole(resolvedParentMenuID));
    }
  }, [parentMainMenuList]);

  async function refreshIssue() {
    let last_click_menu_id = sessionStorageReadWrite.getLastSelectedMainMenuIDFromSession();
    let last_click_screen_id = sessionStorageReadWrite.getLastSelectedScreenIDFromSession();
    setActiveMenuID(last_click_menu_id || '0');
    setSelectedIndex(last_click_screen_id || '0');
  }

  async function getMenuModelsByRole(mainMenuID) {
    const response = await CommonGet('/api/MainNavMenu/GetMenuModelsByRole', 'roleID=' + tokenService.getRoleIDFromToken() + '&mainMenuID=' + mainMenuID);
    setmainNavigationMenu(response.data);
  }

  async function getParentMenuByRole() {
    const response = await CommonGet('/api/ParentMainMenu/GetParentMenuByRole', 'roleID=' + tokenService.getRoleIDFromToken());
    setParentMainMenuList(response.data);
  }

  function ClearScreenMemory() {
    sessionStorageReadWrite.removeLastSelectedMainMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedParentMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedScreenIDFromSession();
    setSelectedIndex(0);
    setActiveMenuID('0');
  }

  const sidebarProps = {
    parentMainMenuList,
    activeParentMenuID,
    panelOpen,
    mainNavigationMenu,
    activeMenuID,
    selectedIndex,
    handleMainMenuClick,
    handleClick,
    buttonProps
  };

  return (
    <>
      <LoadingComponent />

      {/* DESKTOP */}
      <div
        className="tw-scope hidden lg:block fixed left-0 top-[70px] h-[calc(100%-70px)] z-20 bg-white transition-[width] duration-150"
        style={{ width: panelOpen ? 300 : 64, borderRight: '1px solid #EFEFEF' }}
      >
        <SidebarBody {...sidebarProps} />
      </div>

      {/* MOBILE */}
      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={closeMobile} className="relative z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="-translate-x-full" enterTo="translate-x-0"
            leave="ease-in duration-150" leaveFrom="translate-x-0" leaveTo="-translate-x-full"
          >
            <Dialog.Panel
              className="tw-scope fixed left-0 top-0 h-full w-[300px] max-w-[80vw] bg-white"
              style={{ borderRight: '1px solid #EFEFEF' }}
            >
              <SidebarBody {...sidebarProps} />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
};

export default NavBar;
