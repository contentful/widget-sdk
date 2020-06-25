import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as AppLifecycleTracking from '../AppLifecycleTracking';
import { AppPermissions } from '../AppPermissions';
import { AppPropType } from './shared';
import { css } from 'emotion';

const styles = {
  permissions: css({
    display: 'flex',
    justifyContent: 'center',
  }),
};

export function AppPermissionScreen({ app, onInstall, onCancel, onClose, spaceInformation }) {
  useEffect(() => {
    AppLifecycleTracking.permissionsOpened(app.id);
  }, [app.id]);

  const onAuthorize = () => {
    AppLifecycleTracking.permissionsAccepted(app.id);
    onClose(true);
    onInstall();
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

AppPermissionScreen.propTypes = {
  app: AppPropType.isRequired,
  onInstall: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  spaceInformation: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    spaceName: PropTypes.string.isRequired,
    envMeta: PropTypes.shape({
      environmentId: PropTypes.string.isRequired,
      isMasterEnvironment: PropTypes.bool.isRequired,
      aliasId: PropTypes.string,
    }),
  }),
};
