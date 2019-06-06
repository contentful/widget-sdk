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
import { createSpaceEndpoint } from 'data/EndpointFactory.es6';
import { createTasksStoreForEntry } from './TasksStore.es6';
import { createTasksStoreInteractor } from './TasksInteractor.es6';
import TasksWidget from './TasksWidget.es6';

export default class TasksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {};

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_TASKS_WIDGET, this.onUpdateTasksWidget);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.TASKS);
  }

  onUpdateTasksWidget = async update => {
    const { spaceId, entityInfo } = update;

    // TODO: Pass tasksStore instead!
    const endpoint = createSpaceEndpoint(spaceId);
    const tasksStore = createTasksStoreForEntry(endpoint, entityInfo.id);

    // TODO: Replace this whole component with a react independent controller.
    //  Do not pass setState but a more abstract store.
    const tasksInteractor = createTasksStoreInteractor(tasksStore, val => this.setState(val));
    this.setState({ tasksInteractor });

    tasksStore.items$.onValue(tasks => {
      if (!tasks) {
        return;
      }
      this.setState({ tasks });
    });
    tasksStore.items$.onError(error => {
      // TODO: Error handling (e.g. endpoint can't be reached)
      // eslint-disable-next-line no-console
      console.log('ERROR', error);
    });
  };

  render() {
    const { tasksInteractor, tasks } = this.state;
    const tasksViewData = tasks
      ? createTasksViewDataFromComments(tasks, this.state)
      : createLoadingStateTasksViewData();
    return (
      <ErrorHandler>
        <BooleanFeatureFlag featureFlagKey={FeatureFlagKey.TASKS}>
          <EntrySidebarWidget testId="sidebar-tasks-widget" title="Tasks">
            <TasksWidget viewData={tasksViewData} tasksInteractor={tasksInteractor} />
          </EntrySidebarWidget>
        </BooleanFeatureFlag>
      </ErrorHandler>
    );
  }
}
