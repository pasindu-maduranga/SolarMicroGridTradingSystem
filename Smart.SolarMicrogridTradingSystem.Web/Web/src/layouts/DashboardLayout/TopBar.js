import React, { useState, useEffect, Fragment } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import Logo from 'src/components/Logo';
import tokenService from '../../utils/tokenDecoder';
import sessionStorageReadWrite from 'src/utils/sessionStorageReadWrite';
import { useSidebar } from './SidebarContext';

const IconButton = ({ children, ...rest }) => (
  <button
    type="button"
    className="w-10 h-10 rounded-lg flex items-center justify-center text-[#726A58] hover:bg-[#F4F1E8] hover:text-[#22201A] transition-colors"
    {...rest}
  >
    {children}
  </button>
);

const TopBar = () => {
  const navigate = useNavigate();
  const { openMobile } = useSidebar();
  const [userName, setUserName] = useState();
  const [roleName, setRoleName] = useState();

  useEffect(() => {
    setUserName(tokenService.getUserNameFromToken());
    setRoleName(tokenService.getRoleNameFromToken());
  }, []);

  function ClearAllSessionStorageItems() {
    sessionStorageReadWrite.removeTokenFromSession();
    sessionStorageReadWrite.removeLastSelectedMainMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedParentMenuIDFromSession();
    sessionStorageReadWrite.removeLastSelectedScreenIDFromSession();
  }

  const logout = () => {
    ClearAllSessionStorageItems();
    window.location.href = '/signin';
  };

  const handlePasswordChange = () => {
    let encryptedUserID = btoa(tokenService.getUserIDFromToken().toString());
    navigate('/app/users/changeUserPassword/' + encryptedUserID);
  };

  const initial = (userName || 'A').charAt(0).toUpperCase();

  return (
    <div className="tw-scope fixed top-0 left-0 right-0 h-[70px] z-30 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex items-center px-4 lg:px-6 gap-4">
      <button
        type="button"
        onClick={openMobile}
        aria-label="Open menu"
        className="lg:hidden w-10 h-10 flex items-center justify-center text-[#22201A]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <RouterLink to="/">
        <Logo />
      </RouterLink>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center gap-2.5 bg-[#F4F1E8] rounded-full px-4 py-2 w-[400px] max-w-[40%]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search nodes, prosumers, reservations…"
          aria-label="Search"
          className="bg-transparent border-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] w-full font-sans"
        />
      </div>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center gap-1">
        <IconButton aria-label="Notifications">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        </IconButton>
        <IconButton aria-label="Settings">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </IconButton>
      </div>

      <Menu as="div" className="relative flex items-center gap-2.5 pl-3 lg:border-l border-[#E5E7EB]">
        <Menu.Button className="flex items-center gap-2.5 outline-none">
          <span className="w-10 h-10 rounded-full bg-[#E8F0E6] text-[#54784D] font-bold flex items-center justify-center border-2 border-black/5">
            {initial}
          </span>
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold text-[#111827]">{userName}</span>
            <span className="text-[11px] text-[#6B7280]">{roleName}</span>
          </span>
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 top-14 w-52 bg-white rounded-xl shadow-[0_16px_40px_-16px_rgba(23,60,38,.25)] border border-[#E6DDC4] py-1.5 z-40 focus:outline-none">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  className={`w-full text-left px-4 py-2.5 text-sm text-[#22201A] ${active ? 'bg-[#F4F1E8]' : ''}`}
                >
                  Change Password
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={logout}
                  className={`w-full text-left px-4 py-2.5 text-sm text-[#C0392B] ${active ? 'bg-[#FBE9E7]' : ''}`}
                >
                  Sign out
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default TopBar;
