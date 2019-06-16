import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import { createTaskListViewData, createLoadingStateTasksViewData } from './TasksViewData.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createTasksStoreForEntry } from './TasksStore.es6';
import { createTasksStoreInteractor } from './TasksInteractor.es6';
import TaskList from './TaskList.es6';

export default function TasksWidgetContainerWithFeatureFlag(props) {
  return (
    <ErrorHandler>
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
        <TasksWidgetContainer {...props} />
      </BooleanFeatureFlag>
    </ErrorHandler>
  );
}

export class TasksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    loadingError: null,
    tasks: null,
    tasksInEditMode: {},
    tasksErrors: {}
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  onUpdateTasksWidget = async update => {
    const { spaceId, entityInfo } = update;

    // TODO: Pass tasksStore instead. Wrap in a factory function though to not trigger
    //  any fetching in case the feature flag is turned off!
    const endpoint = createSpaceEndpoint(spaceId);
    const tasksStore = createTasksStoreForEntry(endpoint, entityInfo.id);

    // TODO: Replace this whole component with a react independent controller.
    //  Do not pass setState but a more abstract store.
    const tasksInteractor = createTasksStoreInteractor(
      tasksStore,
      val => this.setState(val),
      () => this.state
    );
    this.setState({ tasksInteractor });

    tasksStore.items$.onValue(tasks => {
      if (!tasks) {
        return;
      }
      this.setState({ tasks, loadingError: null });
    });
    tasksStore.items$.onError(error => {
      this.setState({ loadingError: error });
    });
  };

  render() {
    const { tasksInteractor, tasks, loadingError } = this.state;
    const tasksViewData =
      tasks || loadingError
        ? createTaskListViewData(tasks, this.state)
        : createLoadingStateTasksViewData();
    return (
      <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks">
        <TaskList viewData={tasksViewData} tasksInteractor={tasksInteractor} />
      </EntrySidebarWidget>
    );
  }
}
