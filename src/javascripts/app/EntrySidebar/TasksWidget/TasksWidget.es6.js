import React from 'react';

export default class ScheduleWidget extends React.Component {
  static propTypes = {};

  render() {
    return (
      <p className="entity-sidebar__help-text" role="note">
        No tasks were defined yet.
      </p>
    );
  }
}
