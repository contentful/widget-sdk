import { useState, useEffect } from 'react';
import { getModule } from 'NgRegistry';
import ReloadNotification from 'app/common/ReloadNotification';
import createResourceService from 'services/ResourceService';
import * as ResourceUtils from 'utils/ResourceUtils';
import * as accessChecker from 'access_control/AccessChecker';
import { getApiKeyRepo } from 'app/settings/api/services/ApiKeyRepoInstance';

async function getData() {
  const spaceContext = getModule('spaceContext');
  const resources = createResourceService(spaceContext.getId());
  const [apiKeys, resource] = await Promise.all([
    getApiKeyRepo().getAll(),
    resources.get('apiKey')
  ]);

  const canCreate = ResourceUtils.canCreate(resource);
  const limits = ResourceUtils.getResourceLimits(resource);
  const enableCreateApiKeyCreation = !accessChecker.shouldDisable('create', 'apiKey');

  return {
    canCreate,
    isLegacyOrganization: ResourceUtils.isLegacyOrganization(spaceContext.organization),
    limits,
    reachedLimit: !canCreate,
    usage: resource.usage,
    apiKeys,
    enableCreateApiKeyCreation
  };
}

export function useApiKeysState() {
  const spaceContext = getModule('spaceContext');

  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState({
    canCreate: false,
    isLegacyOrganization: undefined,
    limit: undefined,
    usage: undefined,
    reachedLimit: undefined,
    apiKeys: []
  });

  function createAPIKey() {
    const spaceName = spaceContext.getData(['name']);
    return getApiKeyRepo().create(spaceName);
  }

  useEffect(() => {
    getData()
      .then(data => {
        setData(data);
        setLoaded(true);
      })
      .catch(error => {
        setLoaded(true);
        ReloadNotification.apiErrorHandler(error);
      });
  }, []);

  return { ...data, loaded, createAPIKey };
}
