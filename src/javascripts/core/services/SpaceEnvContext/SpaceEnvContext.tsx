import React, { createContext, useState, useEffect } from 'react';
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
import { SpaceEnvContextValue } from './types';
import { getSpaceContext } from 'classes/spaceContext';
import { ContentType } from './types';

export const SpaceEnvContext = createContext<SpaceEnvContextValue>({
  currentSpaceContentTypes: [],
  currentEnvironmentId: 'master',
});

export const SpaceEnvContextProvider: React.FC<{}> = (props) => {
  const [contentTypes, setContentTypes] = useState<ContentType[]>(() => getContentTypes());

  useEffect(() => {
    const angularSpaceContext = getSpaceContext();
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

  function getSpace() {
    return getSpaceContext()?.getSpace();
  }

  function getEnvironments() {
    return getSpaceContext()?.environments ?? [];
  }

  function getContentTypes(): ContentType[] {
    const angularSpaceContext = getSpaceContext();
    if (!angularSpaceContext?.publishedCTs?.items$) return [];
    return K.getValue(angularSpaceContext.publishedCTs.items$) || [];
  }

  function getDocPool() {
    return getSpaceContext()?.docPool;
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
    documentPool: getDocPool(),
  };

  return <SpaceEnvContext.Provider value={value}>{props.children}</SpaceEnvContext.Provider>;
};
