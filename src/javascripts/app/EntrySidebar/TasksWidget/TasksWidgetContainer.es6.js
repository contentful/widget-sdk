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
import createTaskPermissionChecker, {
  createProhibitive as createProhibitiveTaskPermissionChecker
} from './TaskPermissionChecker.es6';
import { isOpenTask, onStoreFetchingStatusChange, onPromiseFetchingStatusChange } from './util.es6';
import TaskList from './View/TaskList.es6';
import { Tag, Paragraph } from '@contentful/forma-36-react-components';
import { trackIsTasksAlphaEligible } from './analytics.es6';

export default function TasksWidgetContainerWithFeatureFlag(props) {
  return (
    <ErrorHandler>
      <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
        {({ currentVariation: isEnabled }) => {
          if (isEnabled) {
            trackIsTasksAlphaEligible();
            return <TasksWidgetContainer {...props} />;
          }
          return null;
        }}
      </BooleanFeatureFlag>
    </ErrorHandler>
  );
}

export class TasksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    showUnsupportedEnvironmentWarning: false,
    loadingError: null,
    tasks: null,
    tasksInEditMode: {},
    tasksErrors: {},
    users: [],
    taskPermissionChecker: createProhibitiveTaskPermissionChecker()
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
    const { spaceId, envId, entityInfo, users, currentUser, isSpaceAdmin } = update;

    if (envId !== 'master') {
      this.setState({
        showUnsupportedEnvironmentWarning: true
      });
      return;
    }

    // TODO: Pass tasksStore instead. Wrap in a factory function though to not trigger
    //  any fetching in case the feature flag is turned off!
    // Never pass 'master' as this route is currently not working.
    // For other environments we will get an error, which is expected.
    const endpoint = createSpaceEndpoint(spaceId, envId === 'master' ? null : envId);
    const tasksStore = createTasksStoreForEntry(endpoint, entityInfo.id);

    // TODO: Replace this whole component with a react independent controller.
    //  Do not pass setState but a more abstract store.
    const tasksInteractor = createTasksStoreInteractor(
      tasksStore,
      val => this.setState(val),
      () => this.state
    );
    const taskPermissionChecker = createTaskPermissionChecker(
      currentUser,
      isSpaceAdmin(currentUser)
    );
    this.setState({ tasksInteractor, taskPermissionChecker });

    this.fetchTasks(tasksStore);
    this.fetchUsers(users);
  };

  fetchTasks(tasksStore) {
    this.offTasksFetching = onStoreFetchingStatusChange(tasksStore, status => {
      this.setState({ tasksFetchingStatus: status });
      this.handleTasksFetchingUpdate(status);
    });
  }

  handleTasksFetchingUpdate = ({ data: tasks }) => {
    const { emitter } = this.props;
    if (tasks) {
      const openTasksCount = tasks.filter(isOpenTask).length;
      emitter.emit(SidebarEventTypes.SET_PUBLICATION_BLOCKING, {
        openTasks: openTasksCount > 0 ? buildPublicationBlockingWarning(openTasksCount) : false
      });
    }
  };

  async fetchUsers(usersCache) {
    this.offUsersFetching = onPromiseFetchingStatusChange(usersCache.getAll(), status => {
      this.setState({ usersFetchingStatus: status });
    });
  }

  renderTasks() {
    const {
      tasksInteractor,
      tasksFetchingStatus,
      usersFetchingStatus,
      taskPermissionChecker
    } = this.state;
    const { tasksInEditMode, tasksErrors } = this.state;
    const localState = { tasksInEditMode, tasksErrors };
    const tasksViewData = createTaskListViewData(
      tasksFetchingStatus,
      usersFetchingStatus,
      localState,
      taskPermissionChecker
    );
    return <TaskList viewData={tasksViewData} tasksInteractor={tasksInteractor} />;
  }

  renderEnvironmentWarning() {
    return (
      <Paragraph className="entity-sidebar__help-text">
        Tasks are currently only available in your master environment.
      </Paragraph>
    );
  }

  render() {
    const { showUnsupportedEnvironmentWarning } = this.state;
    return (
      <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks" headerNode={<Tag>Alpha</Tag>}>
        {showUnsupportedEnvironmentWarning ? this.renderEnvironmentWarning() : this.renderTasks()}
      </EntrySidebarWidget>
    );
  }
}

function buildPublicationBlockingWarning(openTasksCount) {
  const intro = openTasksCount === 1 ? 'There is a pending task' : 'There are pending tasks';
  return `${intro} preventing this entry from being published`;
}
