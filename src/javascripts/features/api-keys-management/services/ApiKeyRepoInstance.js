import { getSpaceContext } from 'classes/spaceContext';
import { createApiKeyRepo } from './ApiKeyRepo';

let apiKeyRepoInstance = null;

export function getApiKeyRepo() {
  const spaceContext = getSpaceContext();

  if (!apiKeyRepoInstance) {
    apiKeyRepoInstance = createApiKeyRepo(spaceContext.endpoint);
  }

  return apiKeyRepoInstance;
}

export function purgeApiKeyRepoCache() {
  apiKeyRepoInstance = null;
}
