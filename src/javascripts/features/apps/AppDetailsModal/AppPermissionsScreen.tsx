import { css } from 'emotion';
import { MarketplaceApp } from 'features/apps-core';
import React, { useEffect } from 'react';
import * as AppLifecycleTracking from '../AppLifecycleTracking';
import { AppPermissions } from './AppPermissions';
import { SpaceInformation } from './shared';

const styles = {
  permissions: css({
    display: 'flex',
    justifyContent: 'center',
  }),
};

interface Props {
  app: MarketplaceApp;
  onInstall: () => void;
  onCancel: () => void;
  onClose: (authorized: boolean) => void;
  spaceInformation: SpaceInformation;
}

export function AppPermissionScreen({
  app,
  onInstall,
  onCancel,
  onClose,
  spaceInformation,
}: Props) {
  useEffect(() => {
    AppLifecycleTracking.permissionsOpened(app.id);
  }, [app.id]);

  const onAuthorize = async () => {
    AppLifecycleTracking.permissionsAccepted(app.id);
    await onInstall();
    onClose(true);
  };

  const onCancelTracked = () => {
    AppLifecycleTracking.permissionsDismissed(app.id);
    onCancel();
  };

  return (
    <div className={styles.permissions}>
      <AppPermissions
        onAuthorize={onAuthorize}
        onCancel={() => onCancelTracked()}
        icon={app.icon}
        title={app.title}
        space={spaceInformation.spaceName}
        envMeta={spaceInformation.envMeta}
        legal={app.legal}
      />
    </div>
  );
}
