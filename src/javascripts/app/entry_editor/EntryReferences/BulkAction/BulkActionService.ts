/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublishableEntity, VersionedLink, makeLink, BulkAction } from '@contentful/types';

import * as EndpointFactory from 'data/EndpointFactory';
import { getModule } from 'core/NgRegistry';
import APIClient, { APIClientError } from 'data/APIClient';

const BULKACTION_REFRESH_MAX_ATTEMPTS = 30; // number of times we want to perform a refresh
const BULK_ACTION_INITIAL_SLEEP_MS = 1000; // Initial sleep to prevent users of waiting more than necessary
const BULKACTION_REFRESH_INTERVAL_MS = 2000; // wait X amount of time on each refresh

enum BulkActionStatus {
  Created = 'created',
  InProgress = 'inProgress',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

function makeVersionedLink({ entity, includeVersion = false }): VersionedLink {
  const link = makeLink(entity.sys.type, entity.sys.id) as VersionedLink;

  if (includeVersion) {
    link.sys.version = entity.sys.version;
  }

  return link;
}

/**
 * Check if an entity exists in a given list of Entities (by id and type)
 **/
function entityIsAlreadyIncludedInList(entitiesList: VersionedLink[], entity: PublishableEntity) {
  return entitiesList.some(
    (item) => item.sys.id === entity.sys.id && item.sys.type === entity.sys.type
  );
}

type EntityToLinkOptions = {
  entities: PublishableEntity[];
  includeVersion?: boolean;
};

function entitiesToLinks({
  entities,
  includeVersion = false,
}: EntityToLinkOptions): VersionedLink[] {
  const entitiesList: VersionedLink[] = [];

  entities.forEach((entity) => {
    const alreadyIncluded = entityIsAlreadyIncludedInList(entitiesList, entity);

    if (!alreadyIncluded) {
      entitiesList.push(makeVersionedLink({ entity, includeVersion }));
    }
  });

  return entitiesList;
}

// Used to conform to the error format expected from ReferencesSidebar and the one thrown by APIClient
function toErrorDataFormat({ error: { details } }): APIClientError {
  return {
    statusCode: 400,
    data: { details },
  };
}

async function sleep(waitMs) {
  return new Promise((resolve) => setTimeout(resolve, waitMs));
}

/**
 * @description
 * Given a BulkAction ID, returns if the BulkAction has `succeeded` or `failed`
 * (or took too long)
 */
async function waitForBulkActionCompletion({ id }): Promise<BulkAction> {
  let bulkAction: BulkAction;
  let remainingAttempts = BULKACTION_REFRESH_MAX_ATTEMPTS;

  // This is to prevent a short-running BulkAction of holding users more than necessary
  await sleep(BULK_ACTION_INITIAL_SLEEP_MS);

  while (remainingAttempts > 0) {
    bulkAction = await apiClient().getBulkAction(id);

    if (bulkAction.sys.status === BulkActionStatus.Succeeded) {
      return bulkAction;
    }

    if (bulkAction.sys.status === BulkActionStatus.Failed) {
      throw toErrorDataFormat(bulkAction as any);
    }

    remainingAttempts--;
    await sleep(BULKACTION_REFRESH_INTERVAL_MS);
  }

  throw Error(`BulkAction ${id} is taking too long to refresh.`);
}

function createEndpoint() {
  const spaceContext = getModule('spaceContext');
  return EndpointFactory.createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.getAliasId() || spaceContext.getEnvironmentId()
  );
}

function apiClient() {
  return new APIClient(createEndpoint());
}

async function publishBulkAction(entities: PublishableEntity[]): Promise<BulkAction> {
  const items = entitiesToLinks({ entities, includeVersion: true });
  const bulkAction = await apiClient().createPublishBulkAction({
    entities: { items },
  });
  const finalBulkAction = await waitForBulkActionCompletion({ id: bulkAction.sys.id });

  return finalBulkAction;
}

export { publishBulkAction };
