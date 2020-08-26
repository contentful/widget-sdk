import React, { createContext, useMemo } from 'react';
import { getModule } from 'core/NgRegistry';
import {
  getSpaceId,
  getSpaceName,
  getEnvironment,
  getEnvironmentId,
  getEnvironmentName,
  getSpaceData,
} from './utils';

// TODO: Should those methods be inside or outside the provider?

// We can then also create methods such as `getSpaceId`, `getSpaceData`, `getSpaceOrganization`, etc
function getAngularSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext({});

export function SpaceEnvContextProvider(props) {
  const angularSpaceContext = useMemo(() => getAngularSpaceContext(), []);
  const space = getSpace();

  // TODO: Methods depending on the angular space context directly, they should be refactored
  function getSpace() {
    return angularSpaceContext?.getSpace() ?? null;
  }

  // Most common values are exported as property values
  const value = {
    currentSpace: space,
    currentSpaceId: getSpaceId(space),
    currentSpaceName: getSpaceName(space),
    currentSpaceData: getSpaceData(space),
    currentEnvironment: getEnvironment(space),
    currentEnvironmentId: getEnvironmentId(space),
    currentEnvironmentName: getEnvironmentName(space),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
}
