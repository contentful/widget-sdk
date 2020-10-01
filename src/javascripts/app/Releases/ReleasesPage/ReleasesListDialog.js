import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Notification, TextLink } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import { createRelease } from '../releasesService';
import { ReleasesDialog, CreateReleaseForm } from '../ReleasesDialog';
import { ReleasesProvider } from '../ReleasesWidget/ReleasesContext';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { isCurrentEnvironmentMaster } from 'core/services/SpaceEnvContext/utils';

const styles = {
  contentStyle: css({
    paddingTop: tokens.spacingM,
  }),
  notification: css({
    display: 'flex',
    justifyContent: 'space-between',
    '> div': {
      marginRight: tokens.spacing2Xs,
    },
  }),
};

export function ReleaseDetailStateLink({ releaseId }) {
  const { currentSpace } = useSpaceEnvContext();
  const isMasterEnvironment = isCurrentEnvironmentMaster(currentSpace);
  const path = `spaces.detail.${isMasterEnvironment ? '' : 'environment.'}releases.detail`;
  return (
    <StateLink path={path} params={{ releaseId }}>
      {({ onClick, getHref }) => (
        <TextLink href={getHref()} onClick={onClick} testId="view-release">
          View Release
        </TextLink>
      )}
    </StateLink>
  );
}

ReleaseDetailStateLink.propTypes = {
  releaseId: PropTypes.string.isRequired,
};

const ReleasesListDialog = ({ onCancel, onCreateRelease }) => {
  const onSubmit = (releaseName) => {
    return createRelease(releaseName)
      .then((release) => {
        Notification.success(
          <div className={styles.notification}>
            <div>{releaseName} was sucessfully created</div>
            <ReleaseDetailStateLink releaseId={release.sys.id} />
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
          <ReleasesProvider>
            <CreateReleaseForm onClose={onCancel} onSubmit={onSubmit} buttonText="Create Release" />
          </ReleasesProvider>
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
