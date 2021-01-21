/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublishableEntity, VersionedLink, makeLink, BulkAction } from '@contentful/types';

import { sleep } from 'utils/Concurrent';
import APIClient, { APIClientError } from 'data/APIClient';
import * as EndpointFactory from 'data/EndpointFactory';
import { getSpaceContext } from 'classes/spaceContext';
import { getBatchingApiClient } from 'app/widgets/WidgetApi/BatchingApiClient';

const BULKACTION_REFRESH_MAX_ATTEMPTS = 30; // number of times we want to perform a refresh
const BULK_ACTION_INITIAL_SLEEP_MS = 1000; // Initial sleep to prevent users of waiting more than necessary
const BULKACTION_REFRESH_INTERVAL_MS = 2000; // wait X amount of time on each refresh

enum BulkActionStatus {
  Created = 'created',
  InProgress = 'inProgress',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

function makeVersionedLink({ entity, includeVersion = false }): VersionedLink<'Asset' | 'Entry'> {
  const link = makeLink(entity.sys.type, entity.sys.id) as VersionedLink<any>;

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

type VersionedCollection = VersionedLink<'Entry' | 'Asset'>[];

function entitiesToLinks({
  entities,
  includeVersion = false,
}: EntityToLinkOptions): VersionedCollection {
  const entitiesList: VersionedCollection = [];

  entities.forEach((entity) => {
    const alreadyIncluded = entityIsAlreadyIncludedInList(entitiesList, entity);

    if (!alreadyIncluded) {
      entitiesList.push(makeVersionedLink({ entity, includeVersion }));
    }
  });

  return entitiesList;
}

// Used to conform to the error format expected from ReferencesSidebar and the one thrown by APIClient
function toErrorDataFormat({ error }): APIClientError {
  return {
    statusCode: 400,
    data: { details: error?.details },
  };
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
    bulkAction = await batchApiClient().getBulkAction(id);

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

let apiClientMemo: APIClient;

function batchApiClient(): APIClient {
  if (apiClientMemo) return apiClientMemo;

  const spaceContext = getSpaceContext();
  const endpoint = EndpointFactory.createSpaceEndpoint(
    spaceContext.space.data.sys.id,
    spaceContext.getAliasId() || spaceContext.getEnvironmentId()
  );

  // We are using our Endpoint to make sure /environments/:id is present in the path
  apiClientMemo = getBatchingApiClient(new APIClient(endpoint));

  return apiClientMemo;
}

async function getUpdatedEntities(entities: PublishableEntity[]): Promise<PublishableEntity[]> {
  return Promise.all(
    entities.map(({ sys }) => {
      if (sys.type === 'Asset') return batchApiClient().getAsset(sys.id);
      if (sys.type === 'Entry') return batchApiClient().getEntry(sys.id);
    })
  );
}

async function publishBulkAction(selectedEntities: PublishableEntity[]): Promise<BulkAction> {
  const entities = await getUpdatedEntities(selectedEntities);
  const items = entitiesToLinks({ entities, includeVersion: true });

  const bulkAction = await batchApiClient().createPublishBulkAction({
    entities: {
      sys: { type: 'Array' },
      items,
    },
  });
  const finalBulkAction = await waitForBulkActionCompletion({ id: bulkAction.sys.id });

  return finalBulkAction;
}

export { publishBulkAction };
