import React, { createContext } from 'react';
import { setTags } from 'core/monitoring';

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
import { SpaceEnvContextValue } from './types';
import { getSpaceContext } from 'classes/spaceContext';

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({
  currentEnvironmentId: 'master',
  currentResolvedEnvironmentId: 'master',
});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  function getSpace() {
    return getSpaceContext()?.getSpace();
  }

  function getEnvironments() {
    return getSpaceContext()?.environments ?? [];
  }

  function getDocPool() {
    return getSpaceContext()?.docPool;
  }

  function getResources() {
    return getSpaceContext()?.resources;
  }

  const space = getSpace();
  const currentOrganizationId = getOrganizationId(space);
  const currentSpaceId = getSpaceId(space);
  const currentEnvironmentId = getEnvironmentId(space);
  const currentEnvironmentAliasId = getEnvironmentAliasId(space);
  const currentResolvedEnvironmentId = currentEnvironmentAliasId || currentEnvironmentId;

  // set tags to global scope, will be added to error-tracking automagically
  setTags({
    organizationId: currentOrganizationId,
    spaceId: currentSpaceId,
    environmentId: currentEnvironmentAliasId || currentEnvironmentId,
  });

  // Most common values are exported as property values
  const value: SpaceEnvContextValue = {
    currentEnvironment: getEnvironment(space),
    currentEnvironmentId,
    currentEnvironmentAliasId,
    currentResolvedEnvironmentId,
    currentEnvironmentName: getEnvironmentName(space),
    currentOrganization: getOrganization(space),
    currentOrganizationId,
    currentOrganizationName: getOrganizationName(space),
    currentSpace: space,
    currentSpaceData: getSpaceData(space),
    currentSpaceEnvironments: getEnvironments(),
    currentSpaceId,
    currentSpaceName: getSpaceName(space),
    documentPool: getDocPool(),
    resources: getResources(),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
