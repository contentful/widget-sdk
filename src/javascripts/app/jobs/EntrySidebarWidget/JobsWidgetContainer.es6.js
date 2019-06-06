import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import JobsWidget from './JobsWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';

export default class JobsWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    spaceId: undefined,
    environmentId: undefined,
    userId: undefined,
    entityInfo: undefined,
    status: undefined,
    entity: undefined
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_JOBS_WIDGET, this.onUpdatePublicationWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.JOBS);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_JOBS_WIDGET, this.onUpdatePublicationWidget);
  }

  onUpdatePublicationWidget = update => {
    this.setState({ ...update });
  };

  render() {
    const { spaceId, environmentId, userId, entityInfo, entity } = this.state;
    if (!spaceId) {
      return null;
    }

    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.JOBS}>
          <JobsWidget
            spaceId={spaceId}
            environmentId={environmentId}
            userId={userId}
            entity={entity}
            entityInfo={entityInfo}
          />
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
