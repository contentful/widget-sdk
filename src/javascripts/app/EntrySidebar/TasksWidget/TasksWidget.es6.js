import React from 'react';
import PropTypes from 'prop-types';
import TaskViewData from './TasksViewData.es6';
import Visible from 'components/shared/Visible/index.es6';

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
          <ol>
            {tasks.map((task, index) => (
              <li key={`task-${task.key}`}>task</li>
            ))}
          </ol>
        </Visible>
      </React.Fragment>
    );
  }
}
