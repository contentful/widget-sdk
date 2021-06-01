import { SpaceCallbacks } from '@contentful/experience-sdk';
import { noop } from 'lodash';
import { PubSubClient } from 'services/PubSubService';
import type { PlainClientAPI } from 'contentful-management';
import {
  AssetProcessingFinishedPayload,
  ContentEntityUpdatedPayload,
  ContentEntityUpdatedTopic,
  AssetProcessingFinishedTopic,
} from '@contentful/pubsub-types';
import { EnvironmentProps } from 'contentful-management/types';

const GET_WAIT_ON_ENTITY_UPDATE = 500;

function createOnEntityChanged({ cma, pubSubClient, environment }: CreateSpaceCallbacksOptions) {
  return function onEntityChanged(
    entityType: string,
    entityId: string,
    callback: (value: unknown) => void
  ) {
    if (!['Entry', 'Asset'].includes(entityType)) {
      throw new Error('Invalid entity type');
    }
    if (!pubSubClient) {
      return noop;
    }

    const environmentIds = new Set([
      environment.sys.id,
      ...(environment.sys.aliasedEnvironment ? [environment.sys.aliasedEnvironment.sys.id] : []),
      ...(environment.sys.aliases ? environment.sys.aliases.map((alias) => alias.sys.id) : []),
    ]);

    const getEntity =
      entityType === 'Entry'
        ? (id: string) => cma.entry.get({ entryId: id })
        : (id: string) => cma.asset.get({ assetId: id });

    const handler = (msg: ContentEntityUpdatedPayload) => {
      if (
        environmentIds.has(msg.environmentId) &&
        msg.entityType === entityType &&
        msg.entityId === entityId
      ) {
        new Promise((resolve) => setTimeout(resolve, GET_WAIT_ON_ENTITY_UPDATE))
          .then(() => getEntity(entityId))
          .then(callback);
      }
    };

    const assetProcessHandler = (msg: AssetProcessingFinishedPayload) => {
      if (
        environmentIds.has(msg.environmentId) &&
        entityType === 'Asset' &&
        msg.assetId === entityId
      ) {
        getEntity(entityId).then(callback);
      }
    };

    pubSubClient.on(ContentEntityUpdatedTopic, handler);
    pubSubClient.on(AssetProcessingFinishedTopic, assetProcessHandler);

    return () => {
      pubSubClient.off(ContentEntityUpdatedTopic, handler);
      pubSubClient.off(AssetProcessingFinishedTopic, assetProcessHandler);
    };
  };
}

interface CreateSpaceCallbacksOptions {
  pubSubClient: PubSubClient;
  environment: EnvironmentProps;
  cma: PlainClientAPI;
}

export function createSpaceCallbacks(opts: CreateSpaceCallbacksOptions): SpaceCallbacks {
  return {
    onEntityChanged: createOnEntityChanged(opts),
  };
}
