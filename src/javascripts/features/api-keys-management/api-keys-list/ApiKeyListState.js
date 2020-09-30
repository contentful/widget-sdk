import { useState, useEffect } from 'react';
import ReloadNotification from 'app/common/ReloadNotification';
import createResourceService from 'services/ResourceService';
import * as ResourceUtils from 'utils/ResourceUtils';
import * as accessChecker from 'access_control/AccessChecker';
import { getApiKeyRepo } from '../services/ApiKeyRepoInstance';

async function getData({ spaceId, organization }) {
  const resources = createResourceService(spaceId);
  const [apiKeys, resource] = await Promise.all([
    getApiKeyRepo().getAll(),
    resources.get('apiKey'),
  ]);

  const canCreate = ResourceUtils.canCreate(resource);
  const limits = ResourceUtils.getResourceLimits(resource);
  const enableCreateApiKeyCreation = !accessChecker.shouldDisable('create', 'apiKey');

  return {
    canCreate,
    isLegacyOrganization: ResourceUtils.isLegacyOrganization(organization),
    limits,
    reachedLimit: !canCreate,
    usage: resource.usage,
    apiKeys,
    enableCreateApiKeyCreation,
  };
}

export function useApiKeysState({ spaceId, spaceName, organization }) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState({
    canCreate: false,
    isLegacyOrganization: undefined,
    limit: undefined,
    usage: undefined,
    reachedLimit: undefined,
    apiKeys: [],
  });

  function createAPIKey() {
    return getApiKeyRepo().create(spaceName);
  }

  useEffect(() => {
    getData({ spaceId, organization })
      .then((data) => {
        setData(data);
        setLoaded(true);
      })
      .catch((error) => {
        setLoaded(true);
        ReloadNotification.apiErrorHandler(error);
      });
  }, [spaceId, organization]);

  return { ...data, loaded, createAPIKey };
}
