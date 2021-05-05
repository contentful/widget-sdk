import React from 'react';
import { ScheduledActionsListPage } from './page/ScheduledActionsListPage';
import TheLocaleStore from 'services/localeStore';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

import StateRedirect from 'app/common/StateRedirect';

import { ScheduledActionsFeatureFlag } from './ScheduledActionsFeatureFlag';
import { CustomRouter, RouteErrorBoundary, Routes, Route } from 'core/react-routing';

const ScheduledActionsListRoute = () => {
  const defaultLocale = TheLocaleStore.getDefaultLocale();
  const {
    currentSpaceId: spaceId,
    currentEnvironmentId: environmentId,
    currentSpaceContentTypes: contentTypes,
  } = useSpaceEnvContext();

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
          return <StateRedirect path="spaces.detail.entries.list" />;
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