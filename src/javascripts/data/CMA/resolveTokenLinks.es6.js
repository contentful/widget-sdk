import {isPlainObject, set as setPath, get as getPath} from 'lodash';

const isLink = item => getPath(item, ['sys', 'type']) === 'Link';

export default function resolveTokenLinks (tokenData) {
  const root = tokenData.items[0];
  const {includes} = tokenData;
  const lookup = {};
  const visited = {};

  store(root);
  forEachInclude(store);
  resolve(root);
  forEachInclude(resolve);

  return root;

  function store (item) {
    const {type, id} = item.sys;

    if (!getPath(lookup, [type, id])) {
      setPath(lookup, [type, id], item);
    } else {
      throw new Error(`Pair ${type},${id} already stored.`);
    }
  }

  function forEachInclude (fn) {
    Object.keys(includes).forEach(type => {
      includes[type].forEach(item => fn(item));
    });
  }

  function resolve (item) {
    if (item.sys && alreadyVisited(item)) {
      return;
    }

    Object.keys(item).forEach(key => {
      const value = item[key];
      const shouldRecurse = isPlainObject(value) || Array.isArray(value);

      if (isLink(value)) {
        replaceLink(item, key);
      } else if (shouldRecurse) {
        resolve(value);
      }
    });
  }

  function replaceLink (item, key) {
    const {linkType, id} = item[key].sys;
    const target = getPath(lookup, [linkType, id]);

    if (target) {
      item[key] = target;
      resolve(target);
    }
  }

  function alreadyVisited (item) {
    const {type, id} = item.sys;

    if (!getPath(visited, [type, id])) {
      setPath(visited, [type, id], true);
      return false;
    } else {
      return true;
    }
  }
}
