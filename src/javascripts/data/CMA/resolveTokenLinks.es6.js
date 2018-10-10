import { isPlainObject, set as setPath, get as getPath } from 'lodash';

const isLink = item => getPath(item, ['sys', 'type']) === 'Link';

/**
 * @ngdoc service
 * @name data/CMA/resolveTokenLinks
 * @description
 * This module gets data returned by the CMA's `/token` endpoint and resolves
 * all links in it. Even unreferenced `includes` are resolved too.
 *
 * Please note:
 * - this is not a general link resolution function; assumptions about the
 *   expected shape of data were made
 * - this function mutates the object passed into it
 * - while the full `/token` response should be passed into the function, it
 *   will return a resolved `tokenData.items[0]`
 */

/**
 * @ngdoc method
 * @name data/CMA/resolveTokenLinks#resolveTokenLinks
 * @param {object} tokenData
 * @returns {object}
 */

export default function resolveTokenLinks(tokenData) {
  const root = tokenData.items[0];
  const { includes } = tokenData;
  const lookup = {};
  const visited = {};

  store(root);
  forEachInclude(store);
  resolve(root);
  forEachInclude(resolve);

  return root;

  function store(item) {
    const {
      sys: { type, id }
    } = item;

    if (type === 'Role') {
      const spaceId = item.sys.space.sys.id;
      if (!getPath(lookup, [spaceId, type, id])) {
        setPath(lookup, [spaceId, type, id], item);
        return;
      } else {
        throw new Error(`Tuple ${spaceId},${type},${id} already stored.`);
      }
    }

    if (!getPath(lookup, [type, id])) {
      setPath(lookup, [type, id], item);
    } else {
      throw new Error(`Pair ${type},${id} already stored.`);
    }
  }

  function forEachInclude(fn) {
    Object.keys(includes).forEach(type => {
      includes[type].forEach(item => fn(item));
    });
  }

  function resolve(item, parent) {
    if (item.sys && alreadyVisited(item)) {
      return;
    }

    Object.keys(item).forEach(key => {
      const value = item[key];
      const shouldRecurse = isPlainObject(value) || Array.isArray(value);

      if (isLink(value)) {
        replaceLink(item, key, parent);
      } else if (shouldRecurse) {
        resolve(value, item);
      }
    });
  }

  function replaceLink(item, key, parent) {
    let target;
    const {
      sys: { linkType, id }
    } = item[key];
    if (linkType === 'Role') {
      const spaceId = parent.sys.space.sys.id;
      target = getPath(lookup, [spaceId, linkType, id]);
    } else {
      target = getPath(lookup, [linkType, id]);
    }

    if (target) {
      item[key] = target;
      resolve(target);
    }
  }

  function alreadyVisited(item) {
    const { type, id } = item.sys;

    if (!getPath(visited, [type, id])) {
      setPath(visited, [type, id], true);
      return false;
    } else {
      return true;
    }
  }
}
