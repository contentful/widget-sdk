import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%'
  }),
  column: css({ display: 'flex', flexDirection: 'column', alignItems: 'center' }),
  element: css({
    maxWidth: '32rem',
    marginBottom: tokens.spacingM,
    textAlign: 'center'
  })
};

const EmptyStateContainer = ({
  children,
  ['data-test-id']: dataTestId = 'cf-ui-empty-state',
  ...other
}) => {
  return (
    <div className={styles.container} data-test-id={dataTestId} {...other}>
      <div className={styles.column}>
        {React.Children.map(children, (child, i) => (
          <div key={i} className={styles.element}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

EmptyStateContainer.propTypes = {'data-test-id': PropTypes.string };

export default EmptyStateContainer;
