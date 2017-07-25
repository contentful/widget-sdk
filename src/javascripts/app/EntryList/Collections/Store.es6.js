// TODO use native find
import {findIndex, union, difference} from 'lodash';

import I from 'libs/icepick';
import Promise from 'libs/yaku';
import random from 'random';
import TheStore from 'TheStore';
import * as K from 'utils/kefir';

import openCreateCollectionDialog from './CreateDialog';

// TODO Use lenses for updates
// TODO store per space
// TODO use Immutable or icepick
export default function createContentCollectionsStore (spaceEndpoint) {
  const persistor = createPersistor(spaceEndpoint);
  const stateBus = K.createPropertyBus([]);

  return persistor.get()
    .then(function (collections) {
      stateBus.set(collections);
      return {
        state$: stateBus.property,
        addItems: addItems,
        removeItems: removeItems,
        requestCreate: requestCreate,
        remove: remove,
        setName: setName
      };
    });

  function requestCreate (items) {
    openCreateCollectionDialog()
      .then((name) => {
        name = name || 'Untitled collection';
        update((collections) => {
          const id = random.id();
          return I.push(collections, {id, name, items});
        });
      });
  }

  function remove (id) {
    update((collections) => {
      return collections.filter((c) => c.id !== id);
    });
  }

  function addItems (collectionId, itemIds) {
    updateCollection(collectionId, (collection) => {
      return I.updateIn(collection, ['items'], (oldItemIds) => union(oldItemIds, itemIds));
    });
  }

  function removeItems (collectionId, itemIds) {
    updateCollection(collectionId, (collection) => {
      return I.updateIn(collection, ['items'], (oldItemIds) => difference(oldItemIds, itemIds));
    });
  }

  function setName (id, name) {
    updateCollection(id, (collection) => {
      return I.set(collection, ['name'], name);
    });
  }

  function update (fn) {
    const newValue = fn(K.getValue(stateBus.property));
    stateBus.set(newValue);

    // TODO handle failures
    persistor.put(newValue);
  }

  function updateCollection (collectionId, fn) {
    update((collections) => {
      const ix = findIndex(collections, {id: collectionId});
      if (ix > -1) {
        return I.updateIn(collections, [ix], fn);
      } else {
        return collections;
      }
    });
  }
}


function createPersistor (_spaceEndpoint) {
  const localStorage = TheStore.forKey('contentCollections');

  return {get, put};

  // TODO do not use $q
  function get () {
    return Promise.resolve(I.freeze(localStorage.get() || []));
  }

  // TODO We need to build a queue
  function put (collections) {
    return Promise.resolve(localStorage.set(collections));
  }
}
