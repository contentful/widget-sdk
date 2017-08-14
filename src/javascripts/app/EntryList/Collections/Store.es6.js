import {union, difference, find, assign, cloneDeep} from 'lodash';
import random from 'random';
import * as K from 'utils/kefir';
import { createQueue } from 'utils/Concurrent';
import $q from '$q';

import openCreateCollectionDialog from './CreateDialog';
import Notification from 'notification';

const MAX_COLLECTION_SIZE = 120;

const notifySizeExceeded = () => Notification.error(`Collection size cannot exceed ${MAX_COLLECTION_SIZE} entries.`);
const itemsLen = (arr) => arr.length === 1 ? '1 entry was' : `${arr.length} entries were`;

// TODO consider use of immutable data structures
export default function createContentCollectionsStore (spaceEndpoint) {
  const persistor = createPersistor(spaceEndpoint);
  const stateBus = K.createPropertyBus([]);

  return persistor.get()
    .then((collections) => {
      stateBus.set(collections);
      const state$ = stateBus.property;
      return {state$, addItems, removeItems, requestCreate, remove, setName};
    });

  function requestCreate (items) {
    if (items.length > MAX_COLLECTION_SIZE) {
      notifySizeExceeded();
      return;
    }

    openCreateCollectionDialog(getCollections())
      .then((name) => update((colls) => {
        const id = random.id();
        Notification.info(`"${name}" was successfully created.`);
        return [].concat(colls).concat([{id, name, items}]);
      }));
  }

  function remove (id) {
    update((colls) => colls.filter((coll) => {
      if (coll.id === id) {
        Notification.info(`"${coll.name}" was successfully removed.`);
        return false;
      } else {
        return true;
      }
    }));
  }

  function addItems (collectionId, itemIds) {
    updateCollection(collectionId, ({id, name, items}) => {
      const updatedItems = union(items, itemIds);
      if (updatedItems.length > MAX_COLLECTION_SIZE) {
        notifySizeExceeded();
        return {id, name, items};
      } else {
        Notification.info(`${itemsLen(itemIds)} successfully added to "${name}".`);
        return {id, name, items: updatedItems};
      }
    });
  }

  function removeItems (collectionId, itemIds) {
    updateCollection(collectionId, ({id, name, items}) => {
      Notification.info(`${itemsLen(itemIds)} successfully removed from "${name}".`);
      return {id, name, items: difference(items, itemIds)};
    });
  }

  function setName (collectionId, newName) {
    updateCollection(collectionId, ({id, name, items}) => {
      if (find(getCollections(), {name: newName})) {
        Notification.error(`There is already a collection named "${newName}".`);
        return {id, name, items};
      } else {
        Notification.info(`Successfully renamed "${name}" to "${newName}".`);
        return {id, name: newName, items};
      }
    });
  }

  function update (fn) {
    const value = getCollections();
    const newValue = fn(value);
    stateBus.set(newValue);

    persistor.put(newValue)
      .catch(() => {
        Notification.error('Changes could not be stored. You change was reverted.');
        stateBus.set(value);
      });
  }

  function updateCollection (id, fn) {
    update((colls) => colls.map(coll => coll.id === id ? fn(coll) : coll));
  }

  function getCollections () {
    return K.getValue(stateBus.property);
  }
}

/**
 * Object with 'get' and 'put' methods to handle persistence of
 * collections to the API.
 *
 * Note that the internal format differs from the API format.
 */
function createPersistor (spaceEndpoint) {
  // Keep a reference to the most recent version.
  let version = 0;
  const putQueue = createQueue();

  return {get, put};

  function get () {
    return request({
      method: 'GET'
    }).then(
      (result) => {
        version = result.sys.version;
        return fromApiFormat(result.collections);
      },
      (error) => {
        if (error.status === 404) {
          return [];
        } else {
          return $q.reject(error);
        }
      }
    );
  }

  function put (collections) {
    return putQueue.push(() => sendPut(collections));
  }

  function sendPut (collections) {
    return request({
      method: 'PUT',
      version: version,
      data: {
        collections: toApiFormat(collections)
      }
    }).then((result) => {
      version = result.sys.version;
    });
  }

  function request (opts) {
    return spaceEndpoint(assign(opts, {
      path: ['__user_settings']
    }), {
      'x-contentful-enable-experimental-feature': 'user_settings'
    });
  }
}

function toApiFormat (collections) {
  return cloneDeep(collections).map((c) => {
    c.items = c.items.map((id) => {
      return {
        sys: {
          id: id,
          type: 'Link',
          linkType: 'Entry'
        }
      };
    });
    return c;
  });
}

function fromApiFormat (collections) {
  return collections.map((c) => {
    c.items = c.items.map((link) => link.sys.id);
    return c;
  });
}
