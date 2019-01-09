import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Collaborators from 'app/entity_editor/Collaborators/index.es6';

export default class UsersWidget extends Component {
  static propTypes = {
    users: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }).isRequired
      })
    ).isRequired
  };

  render() {
    const users = this.props.users;
    return (
      <div>
        <h2 className="entity-sidebar__heading">Users</h2>
        {users.length === 0 && (
          <div className="entity-sidebar__no-users">No other users online</div>
        )}
        {users.length > 0 && <Collaborators users={users} shape="rect" />}
      </div>
    );
  }
}
