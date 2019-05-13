import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import SidebarWidgetTypes from 'app/EntrySidebar/SidebarWidgetTypes.es6';
import ScheduleWidget from './ScheduleWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';

export default class ScheduleWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    spaceId: undefined,
    envId: undefined,
    entityInfo: undefined
  };

  componentDidMount() {
    this.props.emitter.on(
      SidebarEventTypes.UPDATED_SCHEDULE_WIDGET,
      this.onUpdatePublicationWidget
    );
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.SCHEDULE);
  }

  componentWillUnmount() {
    this.props.emitter.off(
      SidebarEventTypes.UPDATED_SCHEDULE_WIDGET,
      this.onUpdatePublicationWidget
    );
  }

  onUpdatePublicationWidget = update => {
    this.setState({ ...update });
  };

  render() {
    const { spaceId, envId, entityInfo } = this.state;
    if (!spaceId) {
      return null;
    }
    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.SCHEDULE}>
          <ScheduleWidget spaceId={spaceId} envId={envId} entityInfo={entityInfo} />
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
