import React from 'react';
import PropTypes from 'prop-types';
import { TaskListViewData } from '../ViewData/TaskViewData.es6';
import TasksInteractor from '../TasksInteractor.es6';
import Task from './Task.es6';
import Visible from 'components/shared/Visible/index.es6';
import {
  Paragraph,
  TextLink,
  ValidationMessage,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';
import { taskListStyles as styles } from './styles.es6';

export default class TasksWidget extends React.PureComponent {
  static propTypes = {
    viewData: PropTypes.shape(TaskListViewData),
    tasksInteractor: PropTypes.shape(TasksInteractor)
  };

  renderLoadingState() {
    return (
      <React.Fragment>
        <SkeletonContainer svgHeight={18} className={styles.loadingSkeletonContainer}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
        <ol className={styles.list}>
          <Task isLoading viewData={{}} />
          <Task isLoading viewData={{}} />
          <Task isLoading viewData={{}} />
        </ol>
      </React.Fragment>
    );
  }

  renderTask(taskViewData) {
    const { key, version, isDraft } = taskViewData;
    const { tasksInteractor } = this.props;

    return (
      <li className={styles.listItem} key={key} data-test-id={isDraft ? 'task-draft' : 'task'}>
        <Task
          viewData={taskViewData}
          onEdit={() => tasksInteractor.startEditingTask(key)}
          onCancel={() => tasksInteractor.cancelTaskChanges(key)}
          onSave={({ body, assigneeKey, isDone }) =>
            tasksInteractor.saveTaskChanges(key, { body, assigneeKey, isDone, version })
          }
          onDeleteTask={() => tasksInteractor.deleteTask(key)}
          onStatusChange={async ({ body, assigneeKey, isDone }, callback) => {
            await tasksInteractor.saveTaskChanges(key, { body, assigneeKey, isDone, version });
            callback();
          }}
        />
      </li>
    );
  }

  render() {
    const { viewData, tasksInteractor } = this.props;
    const { statusText, errorMessage, tasks, hasCreateAction, isLoading } = viewData;

    return (
      <React.Fragment>
        {isLoading ? (
          this.renderLoadingState()
        ) : (
          <React.Fragment>
            <Visible if={statusText}>
              <Paragraph className="entity-sidebar__help-text">{statusText}</Paragraph>
            </Visible>
            <Visible if={tasks.length}>
              <ol className={styles.list}>
                {tasks.map(taskViewData => this.renderTask(taskViewData))}
              </ol>
            </Visible>
            {errorMessage && (
              <ValidationMessage testId="task-list-error">{errorMessage}</ValidationMessage>
            )}
            {hasCreateAction && (
              <TextLink
                testId="create-task"
                icon="Plus"
                className={styles.addTaskCta}
                onClick={() => tasksInteractor.startTaskDraft()}>
                Create new task
              </TextLink>
            )}{' '}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
