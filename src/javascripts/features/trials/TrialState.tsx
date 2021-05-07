import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import {
  CustomRouter,
  RouteErrorBoundary,
  Route,
  Routes,
  useNavigationState,
} from 'core/react-routing';
import { StartAppTrialProps } from './components/StartAppTrial';
import StateRedirect from 'app/common/StateRedirect';
import { getModule } from 'core/NgRegistry';

async function importer() {
  return await import(/* webpackChunkName: "organization-settings" */ './components/StartAppTrial');
}

const StartAppTrialWrapper = withOrganizationRoute((props: StartAppTrialProps) => {
  const navigationState = useNavigationState<{
    from?: string;
    existingUsers: boolean;
  }>();
  return (
    <LazyLoadedComponent importer={importer}>
      {({ StartAppTrial }) => {
        return <StartAppTrial {...navigationState} {...props} />;
      }}
    </LazyLoadedComponent>
  );
});

export const trialState = {
  name: 'start_trial',
  url: '/start_trial{pathname:any}',
  params: {
    navigationState: null,
  },
  component: function TrialStateRouter() {
    const [basename] = window.location.pathname.split('start_trial');
    const { orgId } = getModule('$stateParams');

    return (
      <CustomRouter splitter="/start_trial">
        <RouteErrorBoundary>
          <Routes basename={basename + 'start_trial'}>
            <Route
              name="account.organizations.start_trial"
              path="/"
              element={<StartAppTrialWrapper orgId={orgId} />}
            />
            <Route name={null} path="*" element={<StateRedirect path="home" />} />
          </Routes>
        </RouteErrorBoundary>
      </CustomRouter>
    );
  },
};
