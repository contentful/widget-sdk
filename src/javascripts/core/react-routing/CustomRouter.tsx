import { getModule } from '../NgRegistry';
import { MemoryRouter, useLocation } from 'react-router-dom';
import * as React from 'react';

function SyncState({ splitter }: { splitter: string }) {
  const location = useLocation();

  React.useEffect(() => {
    const $state = getModule('$state');
    const $stateParams = getModule('$stateParams');

    $state.transitionTo(
      $state.current,
      { ...$stateParams, navigationState: null, pathname: location.pathname.split(splitter)[1] },
      { reload: false, inherit: true, notify: false, location: true }
    );
  }, [location.pathname, splitter]);

  return null;
}

export function CustomRouter({
  children,
  splitter,
}: {
  children: JSX.Element | JSX.Element[];
  splitter: string;
}) {
  const $stateParams = getModule('$stateParams');
  return (
    <MemoryRouter
      initialEntries={[
        {
          pathname: window.location.pathname,
          search: window.location.search,
          state: $stateParams.navigationState,
        },
      ]}>
      <SyncState splitter={splitter} />
      {children}
    </MemoryRouter>
  );
}
