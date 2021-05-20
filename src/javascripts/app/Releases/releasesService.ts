import { getSpaceContext } from 'classes/spaceContext';
import { isEqual, uniqWith } from 'lodash';
import * as EndpointFactory from 'data/EndpointFactory';
import APIClient from 'data/APIClient';
import { create as createDto } from 'app/ScheduledActions/EntrySidebarWidget/ScheduledActionsFactory.js';
import * as ScheduledActionsService from 'app/ScheduledActions/DataManagement/ScheduledActionsService';
import type { Entity, Link, Release, ReleaseAction } from '@contentful/types';
import { track } from 'analytics/Analytics';

const toArrayOfUnique = <T extends Entity>(entities: T[]): T[] => uniqWith(entities, isEqual);

type ReleasableEntityType = 'Entry' | 'Asset';
type ReleaseActionType = 'publish' | 'unpublish';

const TrackingEvents = {
  RELEASE_CREATED: 'release:created',
  RELEASE_TRASHED: 'release:trashed',
};

function getContextIds() {
  const spaceContext = getSpaceContext();

  return {
    spaceId: spaceContext.getId() as string,
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
      type: 'Link' as const,
      linkType: item.sys.type,
      id: item.sys.id,
    },
  }));
  const release = await apiClient.createRelease(title, toArrayOfUnique(arrayOfEntityLinks));

  track(TrackingEvents.RELEASE_CREATED, { releaseId: release.sys.id });

  return release;
}

async function getReleases(query): Promise<Release[]> {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.getReleases(query);
}

async function deleteRelease(id: string) {
  const apiClient = new APIClient(createEndpoint());
  track(TrackingEvents.RELEASE_TRASHED, { releaseId: id });
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

async function publishRelease(releaseId: string, version: number) {
  const apiClient = new APIClient(createEndpoint());
  return await apiClient.publishRelease(releaseId, version);
}

interface UpdateReleaseFields {
  title?: string;
  items?: Link<'Entry' | 'Asset'>[];
}
async function updateRelease(release: Release, updates: UpdateReleaseFields) {
  const title = updates.title ? updates.title : release.title;
  const items = toArrayOfUnique(updates.items ? updates.items : release.entities.items);

  const updatedRelease: Release = {
    ...release,
    title,
    entities: {
      sys: { type: 'Array' },
      items,
    },
  };

  const apiClient = new APIClient(createEndpoint());
  return apiClient.updateRelease(updatedRelease);
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
  const validationResponse = await apiClient.validateReleaseAction(releaseId, action);
  return validationResponse;
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
  timezone: string;
}

async function createReleaseJob({
  releaseId,
  action,
  scheduledAt,
  timezone,
}: CreateReleaseJobParams) {
  const { environmentId } = getContextIds();
  const job = await ScheduledActionsService.createJob(
    createEndpoint(),
    createDto({
      environmentId: environmentId,
      entityId: releaseId,
      action,
      linkType: 'Release',
      scheduledAt,
      timezone,
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
  publishRelease,
  updateRelease,
  getReleaseAction,
  getReleaseActions,
  validateReleaseAction,
  fetchReleaseJobs,
  createReleaseJob,
  cancelReleaseJob,
};
