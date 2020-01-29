import { get, set, cloneDeep, defaultTo, find } from 'lodash';

/**
 * Replace resource links with actual included resources from the api response payload
 * @param {object} options
 * @param {string[]} options.paths paths of the links to be replaced
 * @param {object} options.includes included resources in response payload
 * @param {array} options.items response payload items
 * @returns {array} items array containing resolved links
 */
export default function ResolveLinks({
  // paths of links to be replaced with included resource.
  // e.g. 'sys.space', 'sys.user'
  paths = [],
  // included resources in response
  includes = {},
  // actual items in the response
  items = []
}) {
  const getFromIncludes = item => {
    const { linkType, id } = item.sys;

    const includedList = get(includes, linkType, []);

    // return included item with the same id
    // or the original item if nothing was found
    return defaultTo(find(includedList, resource => resource.sys.id === id), item);
  };

  return items.map(item => {
    const clone = cloneDeep(item);

    paths.forEach(path => {
      let newValue;
      const obj = get(clone, path);

      if (Array.isArray(obj)) {
        newValue = obj.map(item => getFromIncludes(item));
      } else {
        newValue = getFromIncludes(obj);
      }

      set(clone, path, newValue);
    });

    return clone;
  });
}

// Receives a requester function and a list of `include` paths
// Returns and array with the resolved items

/**
 * Receives a requester function and a list of `include` paths.
 * Returns and array with the resolved items
 * @param {Promise} fetchPromise A promise resulted from a request for a collection
 * @param {string[]} paths A list of strings representing the include paths
 * @returns {array} Array of resolved items
 */
export function fetchAndResolve(fetchPromise, paths) {
  return fetchPromise.then(({ items, includes }) => ResolveLinks({ paths, items, includes }));
}
