import React from 'react';
import ScheduledActionsListPage from '../list/ScheduledActionsListPage';
import TheLocaleStore from 'services/localeStore';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';

import StateRedirect from 'app/common/StateRedirect';

import ScheduledActionsFeatureFlag from '../ScheduledActionsFeatureFlag';

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
              spaceId={spaceId}
              environmentId={environmentId}
              defaultLocale={defaultLocale}
              contentTypes={contentTypes}
            />
          );
        } else if (currentVariation === false) {
          return <StateRedirect path="spaces.detail.entries.list" />;
        } else {
          return null;
        }
      }}
    </ScheduledActionsFeatureFlag>
  );
};

export default ScheduledActionsListRoute;
