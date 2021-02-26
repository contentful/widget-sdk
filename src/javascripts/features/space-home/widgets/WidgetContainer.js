import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    maxWidth: '930px',
    margin: 'auto',
    display: 'flex',
    alignContent: 'flex-start',
    flexWrap: 'wrap',
    padding: '20px',
    alignItems: 'stretch',
  }),
  row: css({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    width: '100%',
    marginTop: tokens.spacingXl,
    '&>div:nth-of-type(n+2)': { marginLeft: tokens.spacingL },
    '&:empty': {
      marginTop: 0,
    },
  }),
  col: css({ flex: 1, maxWidth: '100%' }),
};

export class WidgetContainer extends React.Component {
  static Row = ({ order, children }) => (
    <div className={cx(styles.row, css({ order }))}>{children}</div>
  );
  static Col = ({ children }) => <div className={styles.col}>{children}</div>;

  render() {
    const { children, testId = 'cf-space-home-widget-container' } = this.props;
    return (
      <div data-test-id={testId} className={styles.container}>
        {children}
      </div>
    );
  }
}

WidgetContainer.propTypes = {
  testId: PropTypes.string,
};
