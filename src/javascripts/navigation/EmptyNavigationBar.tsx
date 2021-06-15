import React from 'react';
import { SidepanelContainer } from './Sidepanel/SidepanelContainer';
import NavBar from './NavBar/NavBar';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const store = getBrowserStorage();

export default function EmptyNavigationBar({ triggerText }: { triggerText: React.ReactNode }) {
  const lastUsedOrgId = store.get('lastUsedOrg');
  return (
    <div className="app-top-bar">
      <SidepanelContainer triggerText={triggerText} currentOrgId={lastUsedOrgId} />
      <div className="app-top-bar__outer-wrapper">
        <NavBar />
      </div>
    </div>
  );
}
