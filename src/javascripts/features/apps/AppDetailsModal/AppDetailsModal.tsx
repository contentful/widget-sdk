import { Modal } from '@contentful/forma-36-react-components';
import { MarketplaceApp } from 'features/apps-core';
import React, { useState } from 'react';
import { AppManager } from '../AppOperations';
import { AppDetails } from './AppDetails';
import { SpaceInformation } from './shared';

interface Props {
  isShown: boolean;
  onClose: () => Promise<void>;
  app: MarketplaceApp;
  appManager: AppManager;
  spaceInformation: SpaceInformation;
  usageExceeded?: boolean;
  canManageApps: boolean;
  hasAdvancedAppsFeature?: boolean;
  isContentfulApp?: boolean;
}

export function AppDetailsModal(props: Props) {
  const [showPermissions, setShowPermissions] = useState(false);
  const modalTitle = showPermissions ? `Install ${props.app.title}` : 'App details';
  const modalSize = showPermissions ? undefined : '1000px';
  return (
    <Modal
      allowHeightOverflow
      position="top"
      topOffset={20}
      size={modalSize}
      title={modalTitle}
      isShown={props.isShown}
      onAfterOpen={() => setShowPermissions(props.app.isPrivateApp || false)}
      onClose={props.onClose}>
      <AppDetails
        app={props.app}
        appManager={props.appManager}
        spaceInformation={props.spaceInformation}
        onClose={props.onClose}
        showPermissions={showPermissions}
        setShowPermissions={setShowPermissions}
        usageExceeded={props.usageExceeded}
        canManageApps={props.canManageApps}
        isContentfulApp={props.isContentfulApp}
        hasAdvancedAppsFeature={props.hasAdvancedAppsFeature}
      />
    </Modal>
  );
}
