import {union, difference, find} from 'lodash';
import random from 'random';
import TheStore from 'TheStore';
import * as K from 'utils/kefir';

import openCreateCollectionDialog from './CreateDialog';
import Notification from 'notification';

const MAX_COLLECTION_SIZE = 120;

const notifySizeExceeded = () => Notification.error(`Collection size cannot exceed ${MAX_COLLECTION_SIZE} entries.`);
const itemsLen = (arr) => arr.length === 1 ? '1 entry was' : `${arr.length} entries were`;

// TODO consider use of immutable data structures
// TODO when persistor uses spaceEndpoint drop spaceId
export default function createContentCollectionsStore (spaceEndpoint, spaceId) {
  const persistor = createPersistor(spaceEndpoint, spaceId);
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

// TODO relying on the native Promise
// will use spaceEndpoint return values
function createPersistor (_spaceEndpoint, spaceId) {
  const localStorage = TheStore.forKey(`contentCollections:${spaceId}`);

  return {get, put};

  function get () {
    return Promise.resolve(localStorage.get() || []); // eslint-disable-line no-undef
  }

  // TODO We need to build a queue
  function put (collections) {
    return Promise.resolve(localStorage.set(collections)); // eslint-disable-line no-undef
  }
}
