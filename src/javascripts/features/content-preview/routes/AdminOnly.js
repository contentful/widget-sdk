import React from 'react';
import PropTypes from 'prop-types';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';

export class AdminOnly extends React.Component {
  static propTypes = {
    children: PropTypes.any,
    render: PropTypes.func,
    redirect: PropTypes.string,
  };

  static displayName = 'AdminOnly';

  static defaultProps = {
    redirect: 'spaces.detail.entries.list',
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
    return <StateRedirect path={this.props.redirect} />;
  }
}
