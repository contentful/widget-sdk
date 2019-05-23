import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import TaskViewData from './TasksViewData.es6';
import Task from './Task.es6';
import Visible from 'components/shared/Visible/index.es6';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  list: css({
    border: `1px solid ${tokens.colorElementMid}`,
    borderBottom: '0'
  }),
  listItem: css({
    marginBottom: '0'
  })
};

export default class ScheduleWidget extends React.PureComponent {
  static propTypes = {
    viewData: PropTypes.shape(TaskViewData)
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
              <li className={styles.listItem} key={task.key}>
                <Task
                  body={task.body}
                  assignedTo={task.assignedTo}
                  resolved={task.resolved}
                  createdAt={task.createdAt}
                />
              </li>
            ))}
          </ol>
        </Visible>
      </React.Fragment>
    );
  }
}
