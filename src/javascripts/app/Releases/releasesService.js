import { getModule } from 'core/NgRegistry';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient.js';

function createEndpoint() {
  const spaceContext = getModule('spaceContext');
  return EndpointFactory.createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.space.environment.sys.id
  );
}

async function createRelease(title, items = []) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.createRelease(
    title,
    items.map((item) => ({
      sys: {
        type: 'Link',
        linkType: item.sys.type,
        id: item.sys.id,
      },
    }))
  );
}

async function getReleases(query) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleases(query);
}

async function deleteRelease(id) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.deleteRelease(id);
}

function getReleasesIncludingEntity(entityId, entityType) {
  return getReleases({
    'entities.sys.linkType': entityType,
    'entities.sys.id[in]': entityId,
  });
}

function getReleasesExcludingEntity(entityId, entityType) {
  return getReleases({
    'entities.sys.linkType': entityType,
    'entities.sys.id[nin]': entityId,
  });
}

async function getReleaseById(releaseId) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleaseById(releaseId);
}

async function replaceReleaseById(releaseId, title, items) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.replaceReleaseById(releaseId, title, items);
}

export {
  createRelease,
  getReleases,
  getReleasesIncludingEntity,
  getReleasesExcludingEntity,
  deleteRelease,
  getReleaseById,
  replaceReleaseById,
};
