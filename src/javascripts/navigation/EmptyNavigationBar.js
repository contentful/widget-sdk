import React from 'react';
import SidepanelContainer from './Sidepanel/SidepanelContainer';

export default function EmptyNavigationBar() {
  return (
    <>
      <SidepanelContainer />
      <div className="app-top-bar__outer-wrapper"></div>
    </>
  );
}
