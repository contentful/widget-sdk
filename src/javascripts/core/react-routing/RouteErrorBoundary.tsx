import { withErrorBoundary, ErrorBoundary } from 'react-error-boundary';
import ErrorPage from 'states/ErrorPage';
import * as logger from 'services/logger';
import React from 'react';

export function withRouteErrorBoundary<P>(ComponentThatMayError: React.ComponentType<P>) {
  return withErrorBoundary(ComponentThatMayError, {
    FallbackComponent: ErrorPage,
    onError(error, info) {
      logger.captureError(error, info);
    },
  });
}

export function RouteErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorPage}
      onError={(error, { componentStack }) => {
        logger.captureError(error, { componentStack });
      }}>
      {props.children}
    </ErrorBoundary>
  );
}
