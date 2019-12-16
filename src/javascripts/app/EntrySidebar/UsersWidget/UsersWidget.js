import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntrySidebarWidget from '../EntrySidebarWidget';
import Collaborators from 'app/entity_editor/Collaborators';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  usersWidget: css({
    marginBottom: tokens.spacingM
  }),
  noUsers: css({
    color: tokens.colorTextLight
  })
};

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
      <EntrySidebarWidget title="Users" className={styles.usersWidget}>
        {users.length === 0 && <div className={styles.noUsers}>No other users online</div>}
        {users.length > 0 && <Collaborators users={users} shape="circle" />}
      </EntrySidebarWidget>
    );
  }
}
