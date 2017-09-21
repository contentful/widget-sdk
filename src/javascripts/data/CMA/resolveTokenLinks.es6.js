import {isObject} from 'lodash';

export default function resolveTokenLinks (tokenData) {
  const root = tokenData.items[0];
  const {includes} = tokenData;
  const store = {};
  const unresolvedLinks = {};

  processItem(root);
  Object.keys(includes).forEach(key => includes[key].forEach(processItem));

  return root;

  function processItem (item) {
    collectUnresolvedLinks(item);
    storeItem(item);
    resolveUnresolvedLinksTo(item);
  }

  function storeItem (item) {
    const {type, id} = item.sys;

    if (getItem(type, id)) {
      throw new Error(`Item ${type},${id} already stored`);
    } else {
      store[type] = store[type] || {};
      store[type][id] = item;
    }
  }

  function getItem (type, id) {
    store[type] = store[type] || {};
    return store[type][id];
  }

  function updateUnresolvedLinksFor (type, id, fn) {
    unresolvedLinks[type] = unresolvedLinks[type] || {};
    unresolvedLinks[type][id] = fn(unresolvedLinks[type][id] || []);
  }

  function collectUnresolvedLinks (item) {
    Object.keys(item).forEach(function (key) {
      if (isLink(item[key])) {
        const {linkType, id} = item[key].sys;
        const target = getItem(linkType, id);
        if (target) {
          item[key] = target;
        } else {
          recordUnresolvedLink(item, key);
        }
      } else if (isObject(item[key])) {
        collectUnresolvedLinks(item[key]);
      }
    });
  }

  function recordUnresolvedLink (container, keyContainingLink) {
    const {linkType, id} = container[keyContainingLink].sys;
    updateUnresolvedLinksFor(linkType, id, links => {
      const unresolvedLink = {container, keyContainingLink};
      return [].concat(links).concat([unresolvedLink]);
    });
  }

  function resolveUnresolvedLinksTo (item) {
    const {type, id} = item.sys;
    const linkedItem = getItem(type, id);

    if (linkedItem) {
      unresolvedLinks[type] = unresolvedLinks[type] || {};
      unresolvedLinks[type][id] = unresolvedLinks[type][id] || [];
      unresolvedLinks[type][id].forEach(link => {
        link.container[link.keyContainingLink] = linkedItem;
      });
      updateUnresolvedLinksFor(type, id, () => []);
    }
  }
}

function isLink (obj) {
  return isObject(obj) && 'sys' in obj && obj.sys.type === 'Link';
}
