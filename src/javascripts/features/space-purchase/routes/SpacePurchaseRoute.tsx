import React, { useCallback, useContext } from 'react';
import { FetcherLoading } from 'app/common/createFetcherComponent';
import { SpacePurchaseContainer } from '../components/SpacePurchaseContainer';
import { useAsync } from 'core/hooks/useAsync';
import DocumentTitle from 'components/shared/DocumentTitle';
import EmptyStateContainer from 'components/EmptyStateContainer/EmptyStateContainer';
import { trackEvent } from '../utils/analyticsTracking';
import ErrorState from 'app/common/ErrorState';
import { SpacePurchaseState } from '../context';
import { initialFetch } from './initialFetch';
import { useNavigationState, useSearchParams } from 'core/react-routing';

/**
 * List of possible values for the "preselect" param in this route
 */
export const PRESELECT_VALUES = {
  APPS: 'apps',
};

type Props = {
  orgId: string;
  spaceId?: string;
};

export function SpacePurchaseRoute({ orgId, spaceId }: Props) {
  const navigationState =
    useNavigationState<{
      from?: string;
      preselect?: string;
    }>();

  const [searchParams] = useSearchParams();

  // We do this to allow the use of a URL like /new_space?from= from an external place
  // like the marketing website, while also allowing it to be used internally
  // via `go(...)`. This should become unnecessary or changed when moving from ui-router.
  const from = navigationState?.from || searchParams.get('from') || undefined;
  const preselect = navigationState?.preselect || searchParams.get('preselect');

  const preselectApps = preselect === PRESELECT_VALUES.APPS;

  const {
    state: { sessionId },
    dispatch,
  } = useContext(SpacePurchaseState);

  // We load `purchasingApps` state separately from the other state so that the `SpacePurchaseContainer`
  // knows which specific first step component to display (with its loading state). Not separating them
  // will cause an empty screen while all the data loads, which is undesireable.
  const { data, isLoading, error } = useAsync(
    useCallback(initialFetch(orgId, spaceId, from, preselectApps, dispatch), [])
  );

  // Show the generic loading state until we know if we're purchasing apps or not
  if (isLoading) {
    return (
      <EmptyStateContainer>
        <FetcherLoading />
      </EmptyStateContainer>
    );
  }

  if (error) {
    return <ErrorState />;
  }

  const documentTitle = data?.purchasingApps ? 'Subscription purchase' : 'Space purchase';

  return (
    <>
      <DocumentTitle title={documentTitle} />
      <SpacePurchaseContainer
        purchasingApps={data?.purchasingApps}
        preselectApps={preselectApps}
        track={(eventName, metadata) => {
          trackEvent(
            eventName,
            {
              organizationId: orgId,
              spaceId,
              sessionId,
            },
            metadata
          );
        }}
      />
    </>
  );
}
