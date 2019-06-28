import React, { Component } from 'react';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import PublicationWidget from './PublicationWidget.es6';
import { JobsWidget } from 'app/jobs/index.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';

export default class PublicationWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    status: '',
    updatedAt: null,
    isSaving: false,
    showDiscardButton: false,

    spaceId: undefined,
    environmentId: undefined,
    userId: undefined,
    entity: undefined
  };

  componentDidMount() {
    this.props.emitter.on(
      SidebarEventTypes.UPDATED_PUBLICATION_WIDGET,
      this.onUpdatePublicationWidget
    );
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.PUBLICATION);
  }

  componentWillUnmount() {
    this.props.emitter.off(
      SidebarEventTypes.UPDATED_PUBLICATION_WIDGET,
      this.onUpdatePublicationWidget
    );
  }

  onUpdatePublicationWidget = update => {
    this.setState({ ...update });
  };

  render() {
    const { commands, spaceId, environmentId, entity, userId } = this.state;

    const revert = get(commands, 'revertToPrevious');
    const primary = get(commands, 'primary');
    const secondary = get(commands, 'secondary', []);

    return (
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
        {({ currentVariation }) => {
          return currentVariation ? (
            <JobsWidget
              spaceId={spaceId}
              environmentId={environmentId}
              userId={userId}
              entity={entity}
              status={this.state.status}
              primary={primary}
              secondary={secondary}
              revert={revert}
              isSaving={this.state.isSaving}
              updatedAt={this.state.updatedAt}
            />
          ) : (
            <PublicationWidget
              status={this.state.status}
              primary={primary}
              secondary={secondary}
              revert={revert}
              isSaving={this.state.isSaving}
              updatedAt={this.state.updatedAt}
            />
          );
        }}
      </BooleanFeatureFlag>
    );
  }
}
