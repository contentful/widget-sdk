import React, { createContext, useMemo, useState, useEffect } from 'react';
import deepEqual from 'fast-deep-equal';
import * as K from 'core/utils/kefir';
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
import { SpaceEnv, SpaceEnvContextValue, Environment, SpaceEnvUsers } from './types';
import { getSpaceContext } from 'classes/spaceContext';
import { ContentType } from './types';

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({
  currentSpaceContentTypes: [],
  currentEnvironmentId: 'master',
});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  const angularSpaceContext = useMemo(() => getSpaceContext(), []);
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
  const currentOrganizationId = getOrganizationId(space);
  const currentSpaceId = getSpaceId(space);
  const currentEnvironmentId = getEnvironmentId(space);
  const currentEnvironmentAliasId = getEnvironmentAliasId(space);

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
    currentEnvironmentName: getEnvironmentName(space),
    currentOrganization: getOrganization(space),
    currentOrganizationId,
    currentOrganizationName: getOrganizationName(space),
    currentSpace: space,
    currentSpaceData: getSpaceData(space),
    currentSpaceEnvironments: getEnvironments(),
    currentSpaceId,
    currentSpaceName: getSpaceName(space),
    currentSpaceContentTypes: contentTypes,
    currentUsers: getUsers(),
    documentPool: getDocPool(),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
