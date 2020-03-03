import cfResolveResponse from 'contentful-resolve-response';
import { getModule } from 'NgRegistry';
import { newForLocale } from 'app/entity_editor/entityHelpers.js';
import APIClient from 'data/APIClient.js';
import TheLocaleStore from 'services/localeStore';

async function getReferencesForEntryId(entryId) {
  const spaceContext = getModule('spaceContext');
  const apiClient = new APIClient(spaceContext.endpoint);
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
    orgId: spaceContext.organization.sys.id
  };
}

export { getReferencesForEntryId, getDefaultLocale, getEntityTitle, getUserInfo };
