import React from 'react';
import noop from 'lodash/noop';
import createFetcherComponent, { DelayedLoading } from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import { LoadingState } from 'features/loading-state';

const AsyncComponentFetcher = createFetcherComponent(
  async ({ importer, onReady }: { importer: () => Promise<any>; onReady: VoidFunction }) => {
    onReady();
    const Component = await importer();
    return Component;
  }
);

type Props = {
  onReady?: VoidFunction;
  importer: () => Promise<any>;
  fallback?: React.ComponentType;
  error?: React.ComponentType;
  delay?: number;
  children: (imported: any) => React.ReactNode;
};

const defaultFallback = () => <LoadingState />;
const defaultError = () => <StateRedirect path="home" />;

export default function LazyLoadedComponent({
  onReady = noop,
  importer,
  delay,
  fallback: FallbackComponent = defaultFallback,
  error: ErrorComponent = defaultError,
  children,
}: Props) {
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
