import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@contentful/forma-36-react-components';
import * as tokens from '@contentful/forma-36-tokens';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { css } from 'emotion';

const styles = {
  spinner: css({
    marginTop: `-${tokens.spacingS}`,
    marginRight: tokens.spacingM
  }),
  loadingText: css({
    fontSize: tokens.fontSize2Xl
  })
};

export default function LoadingState({ loadingText }) {
  return (
    <EmptyStateContainer data-test-id="cf-ui-loading-state">
      <div>
        <Spinner className={styles.spinner} size="large" />
        <span className={styles.loadingText}>{loadingText ? loadingText : 'Loading…'}</span>
      </div>
    </EmptyStateContainer>
  );
}

LoadingState.propTypes = {
  loadingText: PropTypes.string
};
