import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TaskViewData from './TasksViewData.es6';
import Task from './Task.es6';
import Visible from 'components/shared/Visible/index.es6';
import tokens from '@contentful/forma-36-tokens';
import { TextLink } from '@contentful/forma-36-react-components';

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
  })
};

export default class ScheduleWidget extends React.PureComponent {
  static propTypes = {
    viewData: PropTypes.shape(TaskViewData),
    onCreateDraft: PropTypes.func,
    onCancelDraft: PropTypes.func,
    onCreateTask: PropTypes.func,
    onUpdateTask: PropTypes.func
  };

  render() {
    const { helpText, tasks } = this.props.viewData;

    return (
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
                  onCreateTask={(taskKey, taskBody) => this.props.onCreateTask(taskKey, taskBody)}
                  onUpdateTask={(taskKey, taskBody) => this.props.onUpdateTask(taskKey, taskBody)}
                />
              </li>
            ))}
          </ol>
        </Visible>
        <TextLink
          icon="Plus"
          className={styles.addTaskCta}
          onClick={() => this.props.onCreateDraft()}>
          Create new task
        </TextLink>
      </React.Fragment>
    );
  }
}
