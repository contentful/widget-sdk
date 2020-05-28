import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Spinner } from '@contentful/forma-36-react-components';

const styles = {
  spinnerWrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    padding: tokens.spacingXl,
    margin: `${tokens.spaxingL} 0`,
  }),
};

export default function Loader() {
  return (
    <div data-test-id="wizard-loader" className={styles.spinnerWrapper}>
      <Spinner size="large" />
    </div>
  );
}
