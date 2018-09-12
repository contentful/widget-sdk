import React from 'react';
import PropTypes from 'prop-types';

export default class UsersList extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    context: PropTypes.any
  };

  componentDidMount() {
    this.props.context.ready = true;
  }

  render() {
    return <div>Users list</div>;
  }
}
