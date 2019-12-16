import React from 'react';
import SidepanelContainer from './Sidepanel/SidepanelContainer';
import NavBar from './NavBar/NavBar';

export default function EmptyNavigationBar() {
  return (
    <>
      <SidepanelContainer />
      <div className="app-top-bar__outer-wrapper">
        <NavBar showQuickNavigation={false} showModernStackOnboardingRelaunch={false} />
      </div>
    </>
  );
}
