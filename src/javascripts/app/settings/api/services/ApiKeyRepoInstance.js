import { getModule } from 'NgRegistry.es6';
import createApiKeyRepo from './ApiKeyRepo';

let apiKeyRepoInstance = null;

export function getApiKeyRepo() {
  const spaceContext = getModule('spaceContext');

  if (!apiKeyRepoInstance) {
    apiKeyRepoInstance = createApiKeyRepo(spaceContext.endpoint);
  }

  return apiKeyRepoInstance;
}

export function purgeApiKeyRepoCache() {
  apiKeyRepoInstance = null;
}
