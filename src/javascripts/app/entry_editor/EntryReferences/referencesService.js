import cfResolveResponse from 'contentful-resolve-response';
import { newForLocale } from 'app/entity_editor/entityHelpers.js';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';
import TheLocaleStore from 'services/localeStore';
import { getSpaceContext } from 'classes/spaceContext';

function createEndpoint() {
  const spaceContext = getSpaceContext();
  return EndpointFactory.createSpaceEndpoint(
    spaceContext.getId(),
    spaceContext.getAliasId() || spaceContext.getEnvironmentId()
  );
}

async function getReferencesForEntryId(entryId) {
  const apiClient = new APIClient(createEndpoint());
  const res = await apiClient.getEntryReferences(entryId);
  return {
    resolved: cfResolveResponse(res),
    response: res,
  };
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
  const spaceContext = getSpaceContext();
  return {
    userId: spaceContext.user.sys.id,
    orgId: spaceContext.organization.sys.id,
  };
}

export { getReferencesForEntryId, getDefaultLocale, getEntityTitle, getUserInfo };
