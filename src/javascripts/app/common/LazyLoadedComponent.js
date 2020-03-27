import React from 'react';
import PropTypes from 'prop-types';

import createFetcherComponent, { DelayedLoading } from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';

const AsyncComponentFetcher = createFetcherComponent(async ({ importer, onReady }) => {
  onReady();

  const Component = await importer();

  return Component;
});

export default function LazyLoadedComponent({
  onReady,
  importer,
  delay,
  fallback: FallbackComponent,
  error: ErrorComponent,
  children,
}) {
  return (
    <AsyncComponentFetcher onReady={onReady} importer={importer}>
      {({ isLoading, isError, data }) => {
        if (isLoading) {
          return (
            <DelayedLoading delay={delay}>
              <FallbackComponent />
            </DelayedLoading>
          );
        }

        if (isError) {
          return <ErrorComponent />;
        }

        return children(data);
      }}
    </AsyncComponentFetcher>
  );
}

LazyLoadedComponent.propTypes = {
  onReady: PropTypes.func.isRequired,
  importer: PropTypes.func.isRequired,
  fallback: PropTypes.func,
  error: PropTypes.func,
  delay: PropTypes.number,
  children: PropTypes.func.isRequired,
};

LazyLoadedComponent.defaultProps = {
  fallback: () => (
    <div className="loading-box--stretched">
      <div className="loading-box__spinner" />
      <div className="loading-box__message">Loading...</div>
    </div>
  ),
  error: () => <StateRedirect path="home" />,
  onReady: () => {},
};
