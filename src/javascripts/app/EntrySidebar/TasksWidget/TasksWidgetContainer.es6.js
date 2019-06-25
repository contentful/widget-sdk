import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import { createTaskListViewData } from './ViewData/TaskViewData.es6';
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createTasksStoreForEntry } from './TasksStore.es6';
import { createTasksStoreInteractor } from './TasksInteractor.es6';
import { onStoreFetchingStatusChange, onPromiseFetchingStatusChange } from './util.es6';
import TaskList from './View/TaskList.es6';

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
    tasksErrors: {},
    users: []
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.offTasksFetching && this.offTasksFetching();
    this.offUsersFetching && this.offUsersFetching();
  }

  onUpdateTasksWidget = async update => {
    const { spaceId, entityInfo, users } = update;

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

    this.fetchTasks(tasksStore);
    this.fetchUsers(users);
  };

  fetchTasks(tasksStore) {
    this.offTasksFetching = onStoreFetchingStatusChange(tasksStore, status => {
      this.setState({ tasksFetchingStatus: status });
    });
  }

  async fetchUsers(usersCache) {
    this.offUsersFetching = onPromiseFetchingStatusChange(usersCache.getAll(), status => {
      this.setState({ usersFetchingStatus: status });
    });
  }

  render() {
    const { tasksInteractor, tasksFetchingStatus, usersFetchingStatus } = this.state;
    const { tasksInEditMode, tasksErrors } = this.state;
    const localState = { tasksInEditMode, tasksErrors };
    const tasksViewData = createTaskListViewData(
      tasksFetchingStatus,
      usersFetchingStatus,
      localState
    );
    return (
      <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks">
        <TaskList viewData={tasksViewData} tasksInteractor={tasksInteractor} />
      </EntrySidebarWidget>
    );
  }
}
