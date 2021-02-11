import { compact, constant } from 'lodash';
import { caseof } from 'sum-types/caseof-eq';
import { Entity } from 'app/entity_editor/Document/types';
import { RequestMethod, SpaceEndpoint } from './types';

export type EntityAction = 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'delete';

/**
 * This service exports a function that calls on of five actions on the
 * REST endpoint for an entry or asset. The actions are, (un)publish,
 * (un)archive, and delete.
 *
 * ~~~js
 * import {Action, makePerform} from 'data/CMA/EntityActions'
 * const perform = makePerform(spaceEndpoint)
 * const updatedEntityData = await perform(Action.Publish(), {
 *   sys: {
 *     id: 'foo',
 *     type: 'Entry',
 *     version: 2,
 *   }
 * })
 * ~~~
 */

// TODO The values returned by the constructor are used in the entity editor
// state controller and for notifications and permissions. Instead of
// relying on the values we should make the dependent functions
// abstract for the actions.
export const Action = {
  Publish: constant<EntityAction>('publish'),
  Unpublish: constant<EntityAction>('unpublish'),
  Archive: constant<EntityAction>('archive'),
  Unarchive: constant<EntityAction>('unarchive'),
  Delete: constant<EntityAction>('delete'),
};

/**
 * A curried function to perform an action on an entity. Called as
 * ~~~js
 * const updatedEntityData = await makePerform(spaceEndpoint)(action, data)
 * ~~~
 * where
 * - 'spaceEndpoint' is a function to make the request to a space as defined
 *   in the 'data/Endpoint' module,
 * - 'action' is one of the actions constructed from the 'Action' export,
 * - and 'data' is the entity payload we want to call the action on.
 *
 * The call returns a promise that resolves with the response payload
 * or rejects with an HTTP error from the spaceEndpoint call.
 */
export function makePerform(spaceEndpoint: SpaceEndpoint) {
  return function perform(action: EntityAction, data: Entity) {
    const [method, path] = restArgs(action);
    const id = data.sys.id;
    const version = data.sys.version;
    const collection = getCollectionName(data.sys.type);
    return spaceEndpoint(
      {
        method,
        path: compact([collection, id, path]),
        version,
      },
      {
        'X-Contentful-Skip-Transformation': 'true',
      }
    );
  };
}

/**
 * Returns a [method, path] tuple that specify which endpoint to call
 * with which method.
 */
function restArgs(action: EntityAction): [RequestMethod, string] {
  return caseof(action, [
    [Action.Publish(), constant(['PUT', 'published'])],
    [Action.Unpublish(), constant(['DELETE', 'published'])],
    [Action.Archive(), constant(['PUT', 'archived'])],
    [Action.Unarchive(), constant(['DELETE', 'archived'])],
    [Action.Delete(), constant(['DELETE'])],
  ]);
}

function getCollectionName(type: string): string {
  if (type === 'Entry') {
    return 'entries';
  }
  if (type === 'Asset') {
    return 'assets';
  }

  throw new Error(`Unknown entity type ${type}`);
}
