import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import { createTasksViewData } from './TasksViewData.es6';
import { fetchComments } from '../CommentsPanel/hooks.es6';
import TasksWidget from './TasksWidget.es6';

// TODO: Move this to './TasksViewData.es6'
const loadingTasksViewData = {
  helpText: 'Loading...',
  tasks: []
};

export default class ScheduleWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    tasksViewData: loadingTasksViewData
  };

  async componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);

    const { spaceId, entityInfo } = this.props;
    console.log('this.props', this.props);

    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  onUpdateTasksWidget = async update => {
    console.log('update!!!!!', update);
    const { spaceId, entityInfo } = update;

    let comments;
    try {
      comments = await fetchComments(spaceId, entityInfo.id);
    } catch (e) {
      console.log('ERROR', e);
    }
    console.log('comments', comments);
    const tasksViewData = createTasksViewData(comments);
    console.log('tasksViewData', tasksViewData);

    this.setState({ tasksViewData });
  };

  render() {
    const tasksViewData = this.state.tasksViewData;
    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
          <EntrySidebarWidget title="Tasks">
            <TasksWidget viewData={tasksViewData} />
          </EntrySidebarWidget>
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
