import React, { createContext, useMemo, useState, useEffect } from 'react';
import { getModule } from 'core/NgRegistry';
import deepEqual from 'fast-deep-equal';
import * as K from 'core/utils/kefir';
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
import { ContentType } from './types';

// We can then also create methods such as `getSpaceId`, `getSpaceData`, `getSpaceOrganization`, etc
function getAngularSpaceContext() {
  return getModule('spaceContext') ?? null;
}

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({
  currentSpaceContentTypes: [],
  currentEnvironmentId: 'master',
});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  const angularSpaceContext = useMemo(() => getAngularSpaceContext(), []);
  const [contentTypes, setContentTypes] = useState<ContentType[]>(() => getContentTypes());

  useEffect(() => {
    if (!angularSpaceContext?.publishedCTs?.items$) return;

    const deregister = K.onValue(
      angularSpaceContext.publishedCTs.items$.skipDuplicates((a, b) => {
        return deepEqual(a, b);
      }),
      (items) => {
        if (angularSpaceContext.resettingSpace) {
          return;
        }
        setContentTypes((items as ContentType[]) || []);
      }
    );

    return deregister;
  }, []); // eslint-disable-line

  // TODO: Methods depending on the angular space context directly, they should be refactored
  function getSpace(): SpaceEnv {
    return angularSpaceContext?.getSpace();
  }

  function getEnvironments(): Environment[] {
    return angularSpaceContext?.environments ?? [];
  }

  function getContentTypes(): ContentType[] {
    if (!angularSpaceContext?.publishedCTs?.items$) return [];

    return K.getValue(angularSpaceContext.publishedCTs.items$) || [];
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
    currentSpaceContentTypes: contentTypes,
    currentUsers: getUsers(),
    documentPool: getDocPool(),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
