import React, { createContext, useMemo, useState, useEffect } from 'react';
import { getModule } from 'core/NgRegistry';
import {
  getSpaceId,
  getSpaceName,
  getEnvironment,
  getEnvironmentId,
  getEnvironmentName,
  getSpaceData,
  getOrganizationId,
  getOrganizationName,
  getOrganization,
} from './utils';
import { SpaceEnv, SpaceEnvContextValue, Environment } from './types';

// We can then also create methods such as `getSpaceId`, `getSpaceData`, `getSpaceOrganization`, etc
function getAngularSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  const angularSpaceContext = useMemo(() => getAngularSpaceContext(), []);
  const [space, setSpace] = useState<SpaceEnv>(getSpace());

  // TODO: This might be removed or improved when we find a refactoring solution for the `resetWithSpace` method
  useEffect(() => {
    const $rootScope = getModule('$rootScope');
    const deregister = $rootScope.$on('spaceContextUpdated', () => setSpace(getSpace()));

    return deregister;
  });

  // TODO: Methods depending on the angular space context directly, they should be refactored
  function getSpace(): SpaceEnv {
    return angularSpaceContext?.getSpace();
  }

  function getEnvironments(): Environment[] {
    return angularSpaceContext?.environments ?? [];
  }

  // Most common values are exported as property values
  const value = {
    currentEnvironment: getEnvironment(space),
    currentEnvironmentId: getEnvironmentId(space),
    currentEnvironmentName: getEnvironmentName(space),
    currentOrganization: getOrganization(space),
    currentOrganizationId: getOrganizationId(space),
    currentOrganizationName: getOrganizationName(space),
    currentSpace: space,
    currentSpaceData: getSpaceData(space),
    currentSpaceEnvironments: getEnvironments(),
    currentSpaceId: getSpaceId(space),
    currentSpaceName: getSpaceName(space),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
