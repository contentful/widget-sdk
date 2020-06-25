import { getModule } from 'core/NgRegistry';
import { isEqual, uniqWith } from 'lodash';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient.js';

const toArrayOfUnique = (entities) => uniqWith(entities, isEqual);

function createEndpoint() {
  const spaceContext = getModule('spaceContext');
  return EndpointFactory.createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.space.environment.sys.id
  );
}

async function createRelease(title, items = []) {
  const apiClient = new APIClient(createEndpoint());
  const arrayOfEntityLinks = items.map((item) => ({
    sys: {
      type: 'Link',
      linkType: item.sys.type,
      id: item.sys.id,
    },
  }));
  return await apiClient.createRelease(title, toArrayOfUnique(arrayOfEntityLinks));
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
  return await apiClient.replaceReleaseById(releaseId, title, toArrayOfUnique(items));
}

async function publishRelease(releaseId, version) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.publishRelease(releaseId, version);
}

async function getReleaseAction(releaseId, actionId) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleaseAction(releaseId, actionId);
}

async function validateReleaseAction(releaseId, action) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.validateReleaseAction(releaseId, action);
}

export {
  createRelease,
  getReleases,
  getReleasesIncludingEntity,
  getReleasesExcludingEntity,
  deleteRelease,
  getReleaseById,
  replaceReleaseById,
  publishRelease,
  getReleaseAction,
  validateReleaseAction,
};
