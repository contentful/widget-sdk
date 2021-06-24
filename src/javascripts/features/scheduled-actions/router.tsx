import React from 'react';
import { ScheduledActionsListPage } from './page/ScheduledActionsListPage';
import TheLocaleStore from 'services/localeStore';
import { useSpaceEnvContext, useSpaceEnvContentTypes } from 'core/services/SpaceEnvContext';

import StateRedirect from 'app/common/StateRedirect';

import { ScheduledActionsFeatureFlag } from './ScheduledActionsFeatureFlag';
import {
  CustomRouter,
  RouteErrorBoundary,
  Routes,
  Route,
  ReactRouterRedirect,
} from 'core/react-routing';

const ScheduledActionsListRoute = () => {
  const defaultLocale = TheLocaleStore.getDefaultLocale();
  const { currentSpaceId: spaceId, currentEnvironmentId: environmentId } = useSpaceEnvContext();
  const { currentSpaceContentTypes: contentTypes } = useSpaceEnvContentTypes();

  return (
    <ScheduledActionsFeatureFlag>
      {({ currentVariation }) => {
        if (currentVariation === true) {
          return (
            <ScheduledActionsListPage
              spaceId={spaceId as string}
              environmentId={environmentId}
              defaultLocale={defaultLocale}
              contentTypes={contentTypes}
            />
          );
        } else if (currentVariation === false) {
          return <ReactRouterRedirect route={{ path: 'entries.list' }} />;
        }
        return null;
      }}
    </ScheduledActionsFeatureFlag>
  );
};

const ScheduledActionsListRouter = () => {
  const [basename] = window.location.pathname.split('jobs');

  return (
    <CustomRouter splitter="jobs">
      <RouteErrorBoundary>
        <Routes basename={basename + 'jobs'}>
          <Route name={'spaces.details.jobs'} path="/" element={<ScheduledActionsListRoute />} />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

const scheduledActionsState = {
  name: 'jobs',
  url: '/jobs{pathname:any}',
  params: {
    navigationState: null,
  },
  component: ScheduledActionsListRouter,
};

export { scheduledActionsState };
