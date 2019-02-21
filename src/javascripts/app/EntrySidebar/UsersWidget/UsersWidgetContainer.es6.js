import React, { Component } from 'react';
import PropTypes from 'prop-types';
import UsersWidget from './UsersWidget.es6';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';

export default class UsersWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    users: []
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_USERS_WIDGET, this.onUpdateCollaborators);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.USERS);
  }

  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_USERS_WIDGET, this.onUpdateCollaborators);
  }

  onUpdateCollaborators = collaborators => {
    this.setState({ users: collaborators });
  };

  render() {
    return <UsersWidget users={this.state.users} />;
  }
}
