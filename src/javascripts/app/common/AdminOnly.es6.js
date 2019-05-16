import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from './StateRedirect.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');

export class AdminOnly extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    render: PropTypes.func,
    redirect: PropTypes.string
  };

  static displayName = 'AdminOnly';

  static defaultProps = {
    redirect: 'spaces.detail.entries.list'
  };

  render() {
    const isAdmin = !!spaceContext.getData('spaceMembership.admin', false);
    if (isAdmin) {
      return this.props.children;
    }
    if (this.props.render) {
      return this.props.render(StateRedirect);
    }
    return <StateRedirect to={this.props.redirect} />;
  }
}

export default AdminOnly;
