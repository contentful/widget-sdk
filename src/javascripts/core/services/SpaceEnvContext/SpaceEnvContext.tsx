import React, { createContext, useMemo } from 'react';

import { getModule } from 'core/NgRegistry';
import {
  getSpaceId,
  getSpaceName,
  getEnvironment,
  getEnvironmentId,
  getEnvironmentAliasId,
  getEnvironmentName,
  getSpaceData,
  getOrganizationId,
  getOrganizationName,
  getOrganization,
} from './utils';
import { SpaceEnv, SpaceEnvContextValue, Environment, SpaceEnvUsers } from './types';

// We can then also create methods such as `getSpaceId`, `getSpaceData`, `getSpaceOrganization`, etc
function getAngularSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({
  currentEnvironmentId: 'master',
});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  const angularSpaceContext = useMemo(() => getAngularSpaceContext(), []);

  // TODO: Methods depending on the angular space context directly, they should be refactored
  function getSpace(): SpaceEnv {
    return angularSpaceContext?.getSpace();
  }

  function getEnvironments(): Environment[] {
    return angularSpaceContext?.environments ?? [];
  }

  function getUsers(): SpaceEnvUsers {
    return angularSpaceContext?.users;
  }

  function getDocPool() {
    return angularSpaceContext?.docPool;
  }

  const space = getSpace();

  // Most common values are exported as property values
  const value: SpaceEnvContextValue = {
    currentEnvironment: getEnvironment(space),
    currentEnvironmentId: getEnvironmentId(space),
    currentEnvironmentAliasId: getEnvironmentAliasId(space),
    currentEnvironmentName: getEnvironmentName(space),
    currentOrganization: getOrganization(space),
    currentOrganizationId: getOrganizationId(space),
    currentOrganizationName: getOrganizationName(space),
    currentSpace: space,
    currentSpaceData: getSpaceData(space),
    currentSpaceEnvironments: getEnvironments(),
    currentSpaceId: getSpaceId(space),
    currentSpaceName: getSpaceName(space),
    currentUsers: getUsers(),
    documentPool: getDocPool(),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
