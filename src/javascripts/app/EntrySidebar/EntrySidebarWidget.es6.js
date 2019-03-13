import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class EntrySidebarWidget extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    testId: PropTypes.string,
    select: PropTypes.node,
    children: PropTypes.node
  };

  static defaultProps = {
    testId: 'cf-entity-sidebar'
  };

  render() {
    const { select, testId, title, children, ...restProps } = this.props;
    return (
      <div data-test-id={testId} {...restProps}>
        <header className="entity-sidebar__header">
          <h2 className="entity-sidebar__heading">{title}</h2>
          {select}
        </header>
        {children}
      </div>
    );
  }
}
