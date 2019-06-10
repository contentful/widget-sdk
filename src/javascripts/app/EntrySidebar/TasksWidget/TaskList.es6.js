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
                {tasks.map(taskViewData => (
                  <li className={styles.listItem} key={taskViewData.key} data-test-id="task">
                    <Task
                      viewData={taskViewData}
                      onCancelDraft={() => tasksInteractor.cancelTaskDraft()}
                      onCreateTask={(key, body) =>
                        // TODO: User ID
                        tasksInteractor.saveTaskDraft(key, body)
                      }
                      onUpdateTask={(key, newBody) =>
                        tasksInteractor.updateTask(key, {
                          body: newBody,
                          version: taskViewData.version
                        })
                      }
                      onDeleteTask={key => tasksInteractor.deleteTask(key)}
                      onCompleteTask={_key => {}}
                    />
                  </li>
                ))}
              </ol>
            </Visible>
            <Visible if={errorMessage}>
              <ValidationMessage>{errorMessage}</ValidationMessage>
            </Visible>
            {hasCreateAction && (
              <TextLink
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
