import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import classNames from 'classnames';

const headerClassName = css({
  fontSize: tokens.spacingS,
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${tokens.colorElementDark}`,
  marginBottom: tokens.spacingL,
  marginTop: tokens.spacingL
});

const titleClassName = css({
  fontSize: tokens.fontSizeS,
  fontWeight: 500,
  textTransform: 'uppercase',
  color: tokens.colorTextLight,
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
        <header className={classNames(headerClassName, 'entity-sidebar__header')}>
          <h2 className={classNames(titleClassName, 'entity-sidebar__heading')}>{title}</h2>
          {headerNode}
        </header>
        {children}
      </div>
    );
  }
}
