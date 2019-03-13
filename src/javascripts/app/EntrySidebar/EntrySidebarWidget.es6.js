import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class EntrySidebarWidget extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    testId: PropTypes.string,
    headerNode: PropTypes.node,
    children: PropTypes.node
  };

  static defaultProps = {
    testId: 'cf-entity-sidebar'
  };

  render() {
    const { headerNode, testId, title, children, ...restProps } = this.props;
    return (
      <div data-test-id={testId} {...restProps}>
        <header className="entity-sidebar__header">
          <h2 className="entity-sidebar__heading">{title}</h2>
          {headerNode}
        </header>
        {children}
      </div>
    );
  }
}
