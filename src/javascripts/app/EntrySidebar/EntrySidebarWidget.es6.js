import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { byName as colors } from 'Styles/Colors.es6';

const headerClassName = css({
  fontSize: '.75rem',
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${colors.elementDark}`,
  marginBottom: '1.5rem',
  marginTop: '1.5rem'
});

const titleClassName = css({
  fontSize: '.75rem',
  fontWeight: 500,
  textTransform: 'uppercase',
  color: colors.textLight,
  borderBottom: 0,
  margin: 0,
  lineHeight: 2,
  letterSpacing: '1px'
});

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
        <header className={headerClassName}>
          <h2 className={titleClassName}>{title}</h2>
          {headerNode}
        </header>
        {children}
      </div>
    );
  }
}
