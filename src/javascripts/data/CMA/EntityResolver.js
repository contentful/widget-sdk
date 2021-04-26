import { chunk, uniq, flatten } from 'lodash';
import { getSpaceContext } from 'classes/spaceContext';

const MAX_IN_IDS = 50;

/**
 *
 *
 * @export
 * @param {*} spaceContext
 * @param {'Entry' | 'Asset'} type
 * @param {Array<string>} ids
 * @returns
 */
export function fetchForType(type, ids) {
  const spaceContext = getSpaceContext();
  let fetch;
  if (type === 'Entry') {
    fetch = (query) => spaceContext.cma.getEntries(query);
  } else if (type === 'Asset') {
    fetch = (query) => spaceContext.cma.getAssets(query);
  } else {
    throw new Error(`Unknown entity type ${type}.`);
  }

  return getEntities(fetch, ids);
}

/**
 * Accepts a list of IDs and fetches and returns the entity data for each of
 * these ids.
 *
 * The order of the returned entities does not correspond to the
 * order of the IDs.
 *
 * If we get a 404 we return an empty array since this indicates that
 * we do not have access to the entities.
 *
 * @param {function(query)} fetch
 *   Queries the apropriate resource collection endpoint
 * @param {string[]} ids
 *   List of entity IDs to query for
 * @returns {Promise<API.Entity[]>}
 */
function getEntities(fetch, ids) {
  const queries = chunk(uniq(ids), MAX_IN_IDS).map((ids) =>
    fetch({
      'sys.id[in]': ids.join(','),
    })
      .then((response) => {
        return response.items;
      })
      .catch((error) => {
        if (error.status === 404) {
          return [];
        } else if (isResponseTooBigError(error) && ids.length > 1) {
          const [ids1, ids2] = chunk(ids, Math.ceil(ids.length / 2));
          return Promise.all([getEntities(fetch, ids1), getEntities(fetch, ids2)]).then(flatten);
        } else {
          return Promise.reject(error);
        }
      })
  );

  return Promise.all(queries).then(flatten);
}

function isResponseTooBigError(e) {
  return e.status === 400 && e.data?.message?.startsWith('Response size too big');
}
