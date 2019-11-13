import { constant, compact } from 'lodash';
import { caseof } from 'sum-types/caseof-eq';

/**
 * @ngdoc service
 * @name data/CMA/EntityActions
 * @description
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
  /**
   * @ngdoc method
   * @name data/CMA/EntityActions#Action.Publish
   * @returns {data/CMA/EntityActions.Action}
   */
  Publish: constant('publish'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityActions#Action.Unpublish
   * @returns {data/CMA/EntityActions.Action}
   */
  Unpublish: constant('unpublish'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityActions#Action.Archive
   * @returns {data/CMA/EntityActions.Action}
   */
  Archive: constant('archive'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityActions#Action.Unarchive
   * @returns {data/CMA/EntityActions.Action}
   */
  Unarchive: constant('unarchive'),
  /**
   * @ngdoc method
   * @name data/CMA/EntityActions#Action.Delete
   * @returns {data/CMA/EntityActions.Action}
   */
  Delete: constant('delete')
};

/**
 * @ngdoc method
 * @name data/CMA/EntityActions#makePerform
 * @description
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
export function makePerform(spaceEndpoint) {
  return function perform(action, data) {
    const [method, path] = restArgs(action);
    const id = data.sys.id;
    const version = data.sys.version;
    const collection = getCollectionName(data.sys.type);
    return spaceEndpoint(
      {
        method,
        path: compact([collection, id, path]),
        version
      },
      {
        'X-Contentful-Skip-Transformation': 'true'
      }
    );
  };
}

/**
 * Returns a [method, path] tuple that specify which endpoint to call
 * with which method.
 */
function restArgs(action) {
  return caseof(action, [
    [Action.Publish(), constant(['PUT', 'published'])],
    [Action.Unpublish(), constant(['DELETE', 'published'])],
    [Action.Archive(), constant(['PUT', 'archived'])],
    [Action.Unarchive(), constant(['DELETE', 'archived'])],
    [Action.Delete(), constant(['DELETE'])]
  ]);
}

function getCollectionName(type) {
  if (type === 'Entry') {
    return 'entries';
  }
  if (type === 'Asset') {
    return 'assets';
  }

  throw new Error(`Unknown entity type ${type}`);
}
