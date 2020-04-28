import { getModule } from 'core/NgRegistry';
import { createApiKeyRepo } from './ApiKeyRepo';

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
