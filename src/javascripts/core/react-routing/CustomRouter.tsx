import { MemoryRouter, useLocation } from 'react-router-dom';
import { getModule } from 'core/NgRegistry';
import * as React from 'react';

function SyncState({ splitter }: { splitter: string }) {
  const location = useLocation();
  const path = location.pathname + location.search;

  React.useEffect(() => {
    const $state = getModule('$state');
    const $stateParams = getModule('$stateParams');

    $state.transitionTo(
      $state.current,
      {
        ...$stateParams,
        navigationState: null,
        pathname: path.split(splitter)[1],
      },
      { reload: false, inherit: true, notify: false, location: true }
    );
  }, [path, splitter]);

  return null;
}

export function CustomRouter({
  children,
  splitter,
  disableSync,
}: {
  children: JSX.Element | JSX.Element[];
  splitter: string;
  disableSync?: boolean;
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
      {disableSync === true ? null : <SyncState splitter={splitter} />}
      {children}
    </MemoryRouter>
  );
}
