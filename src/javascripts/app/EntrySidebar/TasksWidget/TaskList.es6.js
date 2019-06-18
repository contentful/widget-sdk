import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { TaskListViewData } from './TasksViewData.es6';
import TasksInteractor from './TasksInteractor.es6';
import Task from './Task.es6';
import Visible from 'components/shared/Visible/index.es6';
import tokens from '@contentful/forma-36-tokens';
import {
  TextLink,
  ValidationMessage,
  SkeletonContainer,
  SkeletonBodyText
} from '@contentful/forma-36-react-components';

const styles = {
  list: css({
    border: `1px solid ${tokens.colorElementMid}`,
    borderBottom: '0'
  }),
  listItem: css({
    marginBottom: '0'
  }),
  addTaskCta: css({
    marginTop: tokens.spacingS
  }),
  loadingSkeletonContainer: css({
    margin: '18px 0 10px'
  })
};

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
          onSave={(body, assigneeUserId) =>
            tasksInteractor.saveTaskChanges(key, { body, assigneeUserId, version })
          }
          onDeleteTask={() => tasksInteractor.deleteTask(key)}
          onCompleteTask={() => {}} // TODO
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
              <p className="entity-sidebar__help-text" role="note">
                {statusText}
              </p>
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
