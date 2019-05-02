import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import TasksWidget from './TasksWidget.es6';

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
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  onUpdateTasksWidget = update => {
    this.setState(update);
  };

  render() {
    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
          <EntrySidebarWidget title="Tasks">
            <TasksWidget />
          </EntrySidebarWidget>
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
