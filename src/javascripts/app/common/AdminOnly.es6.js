import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from './StateRedirect.es6';
import { getModule } from 'NgRegistry.es6';

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
    const spaceContext = getModule('spaceContext');
    const isAdmin = !!spaceContext.getData('spaceMember.admin', false);

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
