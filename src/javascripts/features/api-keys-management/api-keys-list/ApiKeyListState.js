import { useState, useEffect } from 'react';
import ReloadNotification from 'app/common/ReloadNotification';
import * as ResourceUtils from 'utils/ResourceUtils';
import * as accessChecker from 'access_control/AccessChecker';
import { getApiKeyRepo } from '../services/ApiKeyRepoInstance';

async function getData({ resources }) {
  const [apiKeys, resource] = await Promise.all([
    getApiKeyRepo().getAll(),
    resources.get('apiKey'),
  ]);

  const canCreate = ResourceUtils.canCreate(resource);
  const limits = ResourceUtils.getResourceLimits(resource);
  const enableCreateApiKeyCreation = !accessChecker.shouldDisable('create', 'apiKey');

  return {
    canCreate,
    limits,
    reachedLimit: !canCreate,
    usage: resource.usage,
    apiKeys,
    enableCreateApiKeyCreation,
  };
}

export function useApiKeysState({ spaceName, organization, resources }) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState({
    canCreate: false,
    limit: undefined,
    usage: undefined,
    reachedLimit: undefined,
    apiKeys: [],
  });

  function createAPIKey() {
    return getApiKeyRepo().create(spaceName);
  }

  useEffect(() => {
    getData({ organization, resources })
      .then((data) => {
        setData(data);
        setLoaded(true);
      })
      .catch((error) => {
        setLoaded(true);
        ReloadNotification.apiErrorHandler(error);
      });
  }, [organization, resources]);

  return { ...data, loaded, createAPIKey };
}
