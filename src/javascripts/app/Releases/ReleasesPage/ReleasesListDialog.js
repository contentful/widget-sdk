import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Notification } from '@contentful/forma-36-react-components';
import { createRelease } from '../releasesService';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';
import { ReleasesProvider } from '../ReleasesWidget/ReleasesContext';
import { LaunchAppDeepLinkRaw, getLaunchAppDeepLink } from 'features/contentful-apps';
import { SpaceEnvContextProvider } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

const styles = {
  contentStyle: css({
    paddingTop: tokens.spacingM,
  }),
  notification: css({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    '> div': {
      marginRight: tokens.spacing2Xs,
    },
  }),
};

const ReleasesListDialog = ({ onCancel, onCreateRelease }) => {
  const { currentSpaceId, currentEnvironmentId, currentEnvironmentAliasId } = useSpaceEnvContext();

  const onSubmit = (releaseName) => {
    return createRelease(releaseName)
      .then((release) => {
        const href = getLaunchAppDeepLink(
          currentSpaceId,
          currentEnvironmentAliasId || currentEnvironmentId,
          release.sys.id
        );
        Notification.success(
          <div className={styles.notification}>
            <div>{releaseName} was successfully created</div>
            <LaunchAppDeepLinkRaw
              href={href}
              eventOrigin="releases-widget"
              iconSize={16}
              withIcon
              withExternalIcon
              iconPosition="left">
              View Release
            </LaunchAppDeepLinkRaw>
          </div>
        );
        onCancel();
        onCreateRelease();
      })
      .catch(() => {
        Notification.error(`Failed creating ${releaseName}`);
        onCancel();
      });
  };

  const tabs = {
    new: {
      title: 'Create new',
      render: () => {
        return (
          <SpaceEnvContextProvider>
            <ReleasesProvider>
              <CreateReleaseForm
                onClose={onCancel}
                onSubmit={onSubmit}
                buttonText="Create Release"
              />
            </ReleasesProvider>
          </SpaceEnvContextProvider>
        );
      },
    },
  };

  return (
    <ReleasesDialog
      tabs={tabs}
      title="Create New Release"
      onClose={onCancel}
      defaultTab={'new'}
      contentStyle={styles.contentStyle}
    />
  );
};

ReleasesListDialog.propTypes = {
  onCancel: PropTypes.func,
  onCreateRelease: PropTypes.func,
};

export default ReleasesListDialog;
