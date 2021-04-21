import React, { Component, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';
import EntrySidebarWidget from '../EntrySidebarWidget';
import ErrorHandler from 'components/shared/ErrorHandlerComponent';
import { createTaskListViewData } from './ViewData/TaskViewData';
import { createTasksStoreForEntry } from './TasksStore';
import { createTasksStoreInteractor } from './TasksInteractor';
import { TaskStatus } from 'data/CMA/TasksRepo';
import createTaskPermissionChecker, {
  createProhibitive as createProhibitiveTaskPermissionChecker,
} from './TaskPermissionChecker';
import { onStoreFetchingStatusChange, onPromiseFetchingStatusChange } from './util';
import TaskList from './View/TaskList';
import { trackIsTasksAlphaEligible } from './analytics';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

export default function TasksWidgetContainerWithFeatureFlag(props) {
  const [isEnabled, setIsEnabled] = useState(false);
  const { currentSpaceId: spaceId } = useSpaceEnvContext();

  useEffect(() => {
    async function fetchFeatureFlag() {
      const isEnabled = await getSpaceFeature(spaceId, SpaceFeatures.CONTENT_WORKFLOW_TASKS, false);
      setIsEnabled(isEnabled);
      if (isEnabled) {
        trackIsTasksAlphaEligible();
      }
    }
    fetchFeatureFlag();
  }, [spaceId]);

  return <ErrorHandler>{isEnabled ? <TasksWidgetContainer {...props} /> : null}</ErrorHandler>;
}

export class TasksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    loadingError: null,
    tasks: null,
    tasksInEditMode: {},
    tasksErrors: {},
    users: [],
    taskPermissionChecker: createProhibitiveTaskPermissionChecker(),
    taskCreationBlocked: false,
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.on(SidebarEventTypes.SET_TASK_CREATION_BLOCKING, this.onSetTasksCreation);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.off(SidebarEventTypes.SET_TASK_CREATION_BLOCKING, this.onSetTasksCreation);
    this.offTasksFetching && this.offTasksFetching();
    this.offUsersFetching && this.offUsersFetching();
  }

  onUpdateTasksWidget = async (update) => {
    const { endpoint, entityInfo, users, currentUser, isSpaceAdmin } = update;
    const tasksStore = createTasksStoreForEntry(endpoint, entityInfo.id);

    // TODO: Replace this whole component with a react independent controller.
    //  Do not pass setState but a dedicated, react independent store.
    const tasksInteractor = createTasksStoreInteractor(
      tasksStore,
      (val) => this.setState(val),
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
    this.offTasksFetching = onStoreFetchingStatusChange(tasksStore, (status) => {
      this.setState({ tasksFetchingStatus: status });
      this.handleTasksFetchingUpdate(status);
    });
  }

  handleTasksFetchingUpdate = ({ data: tasks }) => {
    const { emitter } = this.props;
    if (tasks) {
      const openTasksCount = tasks.filter(({ status }) => status === TaskStatus.ACTIVE).length;
      emitter.emit(SidebarEventTypes.SET_PUBLICATION_BLOCKING, {
        openTasks: openTasksCount > 0 ? buildPublicationBlockingWarning(openTasksCount) : false,
      });
    }
  };

  async fetchUsers(usersCache) {
    this.offUsersFetching = onPromiseFetchingStatusChange(usersCache.getAll(), (status) => {
      this.setState({ usersFetchingStatus: status });
    });
  }

  onSetTasksCreation = ({ blocked }) => {
    this.setState({ taskCreationBlocked: blocked });
  };

  renderTasks() {
    const {
      tasksInteractor,
      tasksFetchingStatus,
      usersFetchingStatus,
      taskPermissionChecker,
      taskCreationBlocked,
    } = this.state;
    const { tasksInEditMode, tasksErrors } = this.state;
    const localState = { tasksInEditMode, tasksErrors };
    const tasksViewData = createTaskListViewData(
      tasksFetchingStatus,
      usersFetchingStatus,
      localState,
      taskPermissionChecker,
      taskCreationBlocked
    );
    return <TaskList viewData={tasksViewData} tasksInteractor={tasksInteractor} />;
  }

  render() {
    return (
      <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks">
        {this.renderTasks()}
      </EntrySidebarWidget>
    );
  }
}

function buildPublicationBlockingWarning(openTasksCount) {
  const intro = openTasksCount === 1 ? 'There is a pending task' : 'There are pending tasks';
  return `${intro} preventing this entry from being published`;
}
