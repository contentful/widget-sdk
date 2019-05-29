import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntrySidebarWidget from '../EntrySidebarWidget.es6';
import ErrorHandler from 'components/shared/ErrorHandlerComponent.es6';
import BooleanFeatureFlag from 'utils/LaunchDarkly/BooleanFeatureFlag.es6';
import * as FeatureFlagKey from 'featureFlags.es6';
import {
  createTasksViewDataFromComments,
  createLoadingStateTasksViewData
} from './TasksViewData.es6';
import { fetchComments } from '../CommentsPanel/hooks.es6';
import TasksWidget from './TasksWidget.es6';

// TODO: Move this to './TasksViewData.es6'
const loadingTasksViewData = createLoadingStateTasksViewData();

export default class ScheduleWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    tasksViewData: loadingTasksViewData
  };

  async componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  onUpdateTasksWidget = async update => {
    const { spaceId, entityInfo } = update;

    let comments;
    try {
      comments = await fetchComments(spaceId, entityInfo.id);
    } catch (e) {
      comments = [];
      // eslint-disable-next-line no-console
      console.log('ERROR', e);
    }
    const tasksViewData = createTasksViewDataFromComments(comments);
    this.setState({ tasksViewData });
  };

  handleCreateDraft() {
    const user = {
      firstName: 'Mike',
      lastName: 'Mitchell',
      avatarUrl:
        'https://www.gravatar.com/avatar/02c899bec697256cc19c993945ce9b1e?s=50&d=https%3A%2F%2Fstatic.flinkly.com%2Fgatekeeper%2Fusers%2Fdefault-a4327b54b8c7431ea8ddd9879449e35f051f43bd767d83c5ff351aed9db5986e.png',
      sys: {
        createdAt: '2018-11-02T10:07:46Z',
        updatedAt: '2019-05-08T08:58:33Z'
      }
    };

    const newTask = {
      isDraft: true,
      body: '',
      key: `${Date.now()}`,
      assignedTo: user, // TODO: Replace with assigned to information
      createdBy: user,
      createdAt: `${new Date().toISOString()}`,
      resolved: false // TODO: Replace with resolved flag,
    };

    this.setState(prevState => ({
      ...prevState,
      tasksViewData: {
        ...prevState.tasksViewData,
        hasNewTaskForm: true,
        tasks: [...prevState.tasksViewData.tasks, newTask]
      }
    }));
  }

  handleCancelDraft() {
    this.setState(prevState => {
      return {
        ...prevState,
        tasksViewData: {
          ...prevState.tasksViewData,
          hasNewTaskForm: false,
          tasks: prevState.tasksViewData.tasks.slice(0, -1)
        }
      };
    });
  }

  handleCreateTask(taskKey, taskBody) {
    if (!taskBody) {
      this.setState(prevState => {
        return {
          ...prevState,
          tasksViewData: {
            ...prevState.tasksViewData,
            tasks: prevState.tasksViewData.tasks.map(task => {
              if (task.key === taskKey) {
                return {
                  ...task,
                  validationMessage: 'Your task cannot be empty'
                };
              } else {
                return { ...task };
              }
            })
          }
        };
      });

      return;
    }

    this.setState(prevState => {
      return {
        ...prevState,
        tasksViewData: {
          ...prevState.tasksViewData,
          hasNewTaskForm: false,
          tasks: prevState.tasksViewData.tasks.map(task => {
            if (task.key === taskKey) {
              return {
                ...task,
                isDraft: false,
                body: taskBody
              };
            } else {
              return { ...task };
            }
          })
        }
      };
    });
  }

  handleDeleteTask(taskKey) {
    this.setState(prevState => {
      return {
        ...prevState,
        tasksViewData: {
          ...prevState.tasksViewData,
          tasks: prevState.tasksViewData.tasks.filter(task => task.key !== taskKey)
        }
      };
    });
  }

  render() {
    const tasksViewData = this.state.tasksViewData;

    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
          <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks">
            <TasksWidget
              viewData={tasksViewData}
              onCreateDraft={() => this.handleCreateDraft()}
              onCancelDraft={() => this.handleCancelDraft()}
              onCreateTask={(taskKey, taskBody) => this.handleCreateTask(taskKey, taskBody)}
              onUpdateTask={(taskKey, taskBody) => this.handleCreateTask(taskKey, taskBody)}
              onDeleteTask={taskKey => this.handleDeleteTask(taskKey)}
            />
          </EntrySidebarWidget>
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
