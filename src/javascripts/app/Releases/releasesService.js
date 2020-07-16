import { getModule } from 'core/NgRegistry';
import { isEqual, uniqWith } from 'lodash';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient.js';
import { create as createDto } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsFactory.js';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';

const toArrayOfUnique = (entities) => uniqWith(entities, isEqual);

function getContextIds() {
  const spaceContext = getModule('spaceContext');

  return {
    spaceId: spaceContext.space.data.sys.id,
    environmentId: spaceContext.space.environment.sys.id,
  };
}

function createEndpoint() {
  const { spaceId, environmentId } = getContextIds();
  return EndpointFactory.createSpaceEndpoint(spaceId, environmentId);
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

async function fetchReleaseScheduleJobs(releaseId) {
  const jobCollection = await ScheduledActionsService.getNotCanceledJobsForEntity(
    createEndpoint(),
    releaseId,
    { 'environment.sys.id': getContextIds().environmentId }
  );

  return jobCollection;
}

async function createReleaseScheduleJob({ releaseId, action, scheduledAt }) {
  const { environmentId } = getContextIds();
  const job = await ScheduledActionsService.createJob(
    createEndpoint(),
    createDto({
      environmentId: environmentId,
      entityId: releaseId,
      action: action,
      linkType: 'Release',
      scheduledAt,
    }),
    { 'environment.sys.id': environmentId }
  );
  return job;
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
  fetchReleaseScheduleJobs,
  createReleaseScheduleJob,
};
