import React from 'react';
import PropTypes from 'prop-types';
import SpaceSettings from './SpaceSettings';
import { get } from 'lodash';
import * as ReloadNotification from 'ReloadNotification';
import $state from '$state';
import notification from 'notification';

export default class SpaceSettingsContainer extends React.Component {
  static propTypes = {
    getSpace: PropTypes.func.isRequired,
    getSpacePlan: PropTypes.func.isRequired,
    renameSpace: PropTypes.func.isRequired,
    openDeleteSpaceDialog: PropTypes.func.isRequired
  };

  handleSaveError = err => {
    if (get(err, ['data', 'details', 'errors'], []).length > 0) {
      notification.error('Please provide a valid space name.');
    } else if (get(err, ['data', 'sys', 'id']) === 'Conflict') {
      notification.error(
        'Unable to update space: Your data is outdated. Please reload and try again'
      );
    } else {
      ReloadNotification.basicErrorHandler();
    }
  };

  save = newName => {
    const { getSpace, renameSpace } = this.props;
    const space = getSpace();
    return renameSpace(newName, space.data.sys.version)
      .then(() => {
        // re-render view with new space object
        this.forceUpdate();
        notification.info(`Space renamed to ${newName} successfully.`);
      })
      .catch(this.handleSaveError);
  };

  openRemovalDialog = () => {
    const { openDeleteSpaceDialog, getSpace, getSpacePlan } = this.props;
    const space = getSpace();
    getSpacePlan().then(plan => {
      openDeleteSpaceDialog({
        space: space.data,
        plan,
        onSuccess: () => $state.go('home')
      });
    });
  };

  render() {
    const space = this.props.getSpace();
    return (
      <div className="workbench space-settings">
        <SpaceSettings
          save={this.save}
          openRemovalDialog={this.openRemovalDialog}
          spaceName={space.data.name}
          spaceId={space.getId()}
        />
      </div>
    );
  }
}
