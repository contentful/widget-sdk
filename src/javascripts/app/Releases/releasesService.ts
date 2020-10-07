import { getModule } from 'core/NgRegistry';
import { isEqual, uniqWith } from 'lodash';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient.js';
import { create as createDto } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsFactory.js';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import type { Entity, Release, ReleaseAction } from '@contentful/types';

const toArrayOfUnique = (entities: Entity[]) => uniqWith(entities, isEqual);

type ReleasableEntityType = 'Entry' | 'Asset';
type ReleaseActionType = 'publish' | 'unpublish';

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

async function createRelease(title: string, items: Entity[] = []) {
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

async function getReleases(query): Promise<Release[]> {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleases(query);
}

async function deleteRelease(id: string) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.deleteRelease(id);
}

function getReleasesIncludingEntity(entityId: string, entityType: ReleasableEntityType) {
  return getReleases({
    'entities.sys.linkType': entityType,
    'entities.sys.id[in]': entityId,
  });
}

async function getReleaseById(releaseId: string) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleaseById(releaseId);
}

async function replaceReleaseById(releaseId: string, title: string, items: Entity[]) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.replaceReleaseById(releaseId, title, toArrayOfUnique(items));
}

async function publishRelease(releaseId: string, version: number) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.publishRelease(releaseId, version);
}

async function getReleaseAction(releaseId: string, actionId: string) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleaseAction(releaseId, actionId);
}

type GetReleaseActionInput = {
  releaseId: string;
  actionId: string;
};
async function getReleaseActions(ids: GetReleaseActionInput[]): Promise<ReleaseAction[]> {
  const apiClient = new APIClient(createEndpoint());

  return Promise.all(
    ids.map(({ releaseId, actionId }) => apiClient.getReleaseAction(releaseId, actionId))
  );
}

async function validateReleaseAction(releaseId: string, action: ReleaseActionType) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.validateReleaseAction(releaseId, action);
}

async function fetchReleaseJobs(releaseId: string) {
  const { environmentId } = getContextIds();
  const jobCollection = await ScheduledActionsService.getNotCanceledJobsForEntity(
    createEndpoint(),
    releaseId,
    { 'environment.sys.id': environmentId }
  );

  return jobCollection;
}

interface CreateReleaseJobParams {
  releaseId: string;
  action: ReleaseActionType;
  scheduledAt: Date;
}

async function createReleaseJob({ releaseId, action, scheduledAt }: CreateReleaseJobParams) {
  const { environmentId } = getContextIds();
  const job = await ScheduledActionsService.createJob(
    createEndpoint(),
    createDto({
      environmentId: environmentId,
      entityId: releaseId,
      action,
      linkType: 'Release',
      scheduledAt,
    }),
    { 'environment.sys.id': environmentId }
  );
  return job;
}

async function cancelReleaseJob(jobId: string) {
  const { environmentId } = getContextIds();
  const job = await ScheduledActionsService.cancelJob(createEndpoint(), jobId, {
    'environment.sys.id': environmentId,
  });
  return job;
}

export {
  createRelease,
  getReleases,
  getReleasesIncludingEntity,
  deleteRelease,
  getReleaseById,
  replaceReleaseById,
  publishRelease,
  getReleaseAction,
  getReleaseActions,
  validateReleaseAction,
  fetchReleaseJobs,
  createReleaseJob,
  cancelReleaseJob,
};
