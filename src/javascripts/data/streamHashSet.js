import _ from 'lodash';
import * as K from 'core/utils/kefir';

/**
 * @name Data.StreamHashSet
 * @description
 * A data structure that works like a Set and provides access to the
 * items as a property.
 *
 * The `#add(item)` and `#remove(item)` use `item.sys.id` to obtain
 * the key that is used to store the item. That key can be used to
 * obtain an item with `#get(key)`.
 *
 * The `#items$` property is a Kefir property with flat lists of
 * items as values. The value is updated when ever one of the mutating
 * functions is called.
 */
export function create() {
  const itemsBus = K.createPropertyBus([]);
  let byId = {};

  return {
    items$: itemsBus.property,
    add: add,
    remove: remove,
    reset: reset,
    get: get,
  };

  function get(id) {
    return byId[id];
  }

  function reset(newItems) {
    byId = {};
    addMultiple(newItems);
  }

  function add(item) {
    addMultiple([item]);
    return item;
  }

  function remove(item) {
    const id = item.sys.id;
    if (byId[id] === item) {
      delete byId[id];
      updateItems();
    }
    return item;
  }

  function addMultiple(items) {
    items.forEach((item) => {
      const id = item.sys.id;
      if (byId[id] !== item) {
        byId[id] = item;
      }
    });
    updateItems();
  }

  function updateItems() {
    const items = _.values(byId);
    itemsBus.set(items);
  }
}
