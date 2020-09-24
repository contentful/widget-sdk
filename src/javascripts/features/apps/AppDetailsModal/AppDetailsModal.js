import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@contentful/forma-36-react-components';
import { AppPropType } from './shared';
import { AppDetails } from './AppDetails';

export function AppDetailsModal(props) {
  const [showPermissions, setShowPermissions] = useState(null);
  const modalTitle = showPermissions ? `Install ${props.app.title}` : 'App details';
  const modalSize = showPermissions ? null : '1000px';
  return (
    <Modal
      allowHeightOverflow
      position="top"
      topOffset={20}
      size={modalSize}
      title={modalTitle}
      isShown={props.isShown}
      onAfterOpen={() => setShowPermissions(false)}
      onClose={props.onClose}>
      <AppDetails
        app={props.app}
        spaceInformation={props.spaceInformation}
        onClose={props.onClose}
        showPermissions={showPermissions}
        setShowPermissions={setShowPermissions}
        usageExceeded={props.usageExceeded}
        canManageApps={props.canManageApps}
        hasAdvancedAppsFeature={props.hasAdvancedAppsFeature}
      />
    </Modal>
  );
}

AppDetailsModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  app: AppPropType.isRequired,
  spaceInformation: PropTypes.shape({
    spaceId: PropTypes.string.isRequired,
    spaceName: PropTypes.string.isRequired,
    envName: PropTypes.string.isRequired,
    envIsMaster: PropTypes.bool.isRequired,
  }),
  usageExceeded: PropTypes.bool,
  canManageApps: PropTypes.bool.isRequired,
  hasAdvancedAppsFeature: PropTypes.bool,
};
