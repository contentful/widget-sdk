import React from 'react';
import PropTypes from 'prop-types';

import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';

const AsyncComponentFetcher = createFetcherComponent(async ({ importer, onReady }) => {
  onReady();

  const Component = await importer();

  return Component;
});

export default function LazyLoadedComponent({ onReady, importer, ...rest }) {
  return (
    <AsyncComponentFetcher onReady={onReady} importer={importer}>
      {({ isLoading, isError, data: Component }) => {
        if (isLoading) {
          return <FetcherLoading message="Loading..." />;
        }

        if (isError) {
          return <StateRedirect path="home" />;
        }

        return <Component {...rest} />;
      }}
    </AsyncComponentFetcher>
  );
}

LazyLoadedComponent.propTypes = {
  onReady: PropTypes.func.isRequired,
  importer: PropTypes.func.isRequired
};
