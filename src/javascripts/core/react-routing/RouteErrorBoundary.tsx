import { withErrorBoundary, ErrorBoundary } from 'react-error-boundary';
import ErrorPage from 'states/ErrorPage';
import { captureError } from 'core/monitoring';
import React from 'react';

export function withRouteErrorBoundary<P>(ComponentThatMayError: React.ComponentType<P>) {
  return withErrorBoundary(ComponentThatMayError, {
    FallbackComponent: ErrorPage,
    onError(error, info) {
      captureError(error, { extra: info });
    },
  });
}

export function RouteErrorBoundary(props: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorPage}
      onError={(error, { componentStack }) => {
        captureError(error, {
          extra: { componentStack },
        });
      }}>
      {props.children}
    </ErrorBoundary>
  );
}
