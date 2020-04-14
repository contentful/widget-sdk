import cfResolveResponse from 'contentful-resolve-response';
import { getModule } from 'NgRegistry';
import { newForLocale } from 'app/entity_editor/entityHelpers.js';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient.js';
import TheLocaleStore from 'services/localeStore';

function createEndpoint() {
  const spaceContext = getModule('spaceContext');
  return EndpointFactory.createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.space.environment.sys.id
  );
}

async function getReferencesForEntryId(entryId) {
  const apiClient = new APIClient(createEndpoint());
  const res = await apiClient.getEntryReferences(entryId);
  return cfResolveResponse(res);
}

function getDefaultLocale() {
  return TheLocaleStore.getDefaultLocale();
}

async function getEntityTitle(entity) {
  const defaultLocale = getDefaultLocale();
  const fetchedTitle = await newForLocale(defaultLocale).entityTitle(entity);
  return fetchedTitle || 'Untitled';
}

function getUserInfo() {
  const spaceContext = getModule('spaceContext');
  return {
    userId: spaceContext.user.sys.id,
    orgId: spaceContext.organization.sys.id,
  };
}

function validateEntities({ entities, action }) {
  const apiClient = new APIClient(createEndpoint());
  return apiClient.validateRelease(action, entities);
}

function publishEntities({ entities, action }) {
  const apiClient = new APIClient(createEndpoint());
  return apiClient.executeRelease(action, entities);
}

export {
  getReferencesForEntryId,
  getDefaultLocale,
  getEntityTitle,
  getUserInfo,
  validateEntities,
  publishEntities,
};
