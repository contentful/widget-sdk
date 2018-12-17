import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import SpaceSettings from './SpaceSettings.es6';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification.es6';

const ServicesConsumer = require('../../../reactServiceContext').default;

export class SpaceSettingsRoute extends React.Component {
  static propTypes = {
    $services: PropTypes.shape({
      spaceContext: PropTypes.object.isRequired,
      TokenStore: PropTypes.object.isRequired,
      DeleteSpace: PropTypes.object.isRequired,
      PricingDataProvider: PropTypes.object.isRequired,
      EndpointFactory: PropTypes.object.isRequired,
      $state: PropTypes.object.isRequired
    })
  };

  getSpacePlan = async () => {
    const { spaceContext, PricingDataProvider, EndpointFactory } = this.props.$services;
    const orgId = spaceContext.organization.sys.id;
    const orgEndpoint = EndpointFactory.createOrganizationEndpoint(orgId);
    let plan;
    try {
      plan = await PricingDataProvider.getSingleSpacePlan(orgEndpoint, spaceContext.space.getId());
    } catch (e) {
      // await getSingleSpacePlan throws for spaces on the old pricing
      // because they don't have a space plan. We catch it, dialog can handle lack of plan
    }
    return plan;
  };

  handleSaveError = err => {
    if (get(err, ['data', 'details', 'errors'], []).length > 0) {
      Notification.error('Please provide a valid space name.');
    } else if (get(err, ['data', 'sys', 'id']) === 'Conflict') {
      Notification.error(
        'Unable to update space: Your data is outdated. Please reload and try again'
      );
    } else {
      ReloadNotification.basicErrorHandler();
    }
  };

  save = newName => {
    const { spaceContext, TokenStore } = this.props.$services;
    const space = spaceContext.space;
    return spaceContext.cma
      .renameSpace(newName, space.data.sys.version)
      .then(() => {
        TokenStore.refresh();
        return TokenStore.getSpace(spaceContext.space.data.sys.id);
      })
      .then(newSpace => spaceContext.resetWithSpace(newSpace))
      .then(() => {
        // re-render view with new space object
        this.forceUpdate();
        Notification.success(`Space renamed to ${newName} successfully.`);
      })
      .catch(this.handleSaveError);
  };

  openRemovalDialog = () => {
    const { DeleteSpace, $state, spaceContext } = this.props.$services;
    this.getSpacePlan().then(plan => {
      DeleteSpace.openDeleteSpaceDialog({
        space: spaceContext.space.data,
        plan,
        onSuccess: () => $state.go('home')
      });
    });
  };

  render() {
    const space = this.props.$services.spaceContext.space;
    return (
      <SpaceSettings
        save={this.save}
        onRemoveClick={this.openRemovalDialog}
        spaceName={space.data.name}
        spaceId={space.getId()}
      />
    );
  }
}

export default ServicesConsumer(
  'spaceContext',
  '$state',
  {
    from: 'services/TokenStore.es6',
    as: 'TokenStore'
  },
  {
    from: 'services/DeleteSpace.es6',
    as: 'DeleteSpace'
  },
  {
    from: 'account/pricing/PricingDataProvider.es6',
    as: 'PricingDataProvider'
  },
  {
    from: 'data/EndpointFactory.es6',
    as: 'EndpointFactory'
  }
)(SpaceSettingsRoute);
