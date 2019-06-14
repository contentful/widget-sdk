import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TaskViewData from './TasksViewData.es6';
import Task from './Task.es6';
import Visible from 'components/shared/Visible/index.es6';
import tokens from '@contentful/forma-36-tokens';
import {
  TextLink,
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
    viewData: PropTypes.shape(TaskViewData),
    onCreateDraft: PropTypes.func,
    onCancelDraft: PropTypes.func,
    onCreateTask: PropTypes.func,
    onUpdateTask: PropTypes.func,
    onDeleteTask: PropTypes.func,
    onCompleteTask: PropTypes.func
  };

  renderLoadingState() {
    return (
      <React.Fragment>
        <SkeletonContainer svgHeight={18} className={styles.loadingSkeletonContainer}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
        <ol className={styles.list}>
          <Task isLoading />
          <Task isLoading />
          <Task isLoading />
        </ol>
      </React.Fragment>
    );
  }

  render() {
    const { helpText, tasks, hasNewTaskForm, isLoading } = this.props.viewData;

    return (
      <React.Fragment>
        {isLoading ? (
          this.renderLoadingState()
        ) : (
          <React.Fragment>
            <Visible if={helpText}>
              <p className="entity-sidebar__help-text" role="note">
                {helpText}
              </p>
            </Visible>
            <Visible if={tasks}>
              <ol className={styles.list}>
                {tasks.map(task => (
                  <li className={styles.listItem} key={task.key} data-test-id="task">
                    <Task
                      body={task.body}
                      assignedTo={task.assignedTo}
                      resolved={task.resolved}
                      createdAt={task.createdAt}
                      isDraft={task.isDraft}
                      taskKey={task.key}
                      onCancelDraft={() => this.props.onCancelDraft()}
                      onCreateTask={(taskKey, taskBody) =>
                        this.props.onCreateTask(taskKey, taskBody)
                      }
                      onUpdateTask={(taskKey, taskBody) =>
                        this.props.onUpdateTask(taskKey, taskBody)
                      }
                      onDeleteTask={taskKey => this.props.onDeleteTask(taskKey)}
                      onCompleteTask={taskKey => this.props.onCompleteTask(taskKey)}
                      validationMessage={task.validationMessage}
                    />
                  </li>
                ))}
              </ol>
            </Visible>
            {!hasNewTaskForm && (
              <TextLink
                icon="Plus"
                className={styles.addTaskCta}
                onClick={() => this.props.onCreateDraft()}>
                Create new task
              </TextLink>
            )}{' '}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
