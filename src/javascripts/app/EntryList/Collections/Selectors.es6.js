import {find, includes} from 'lodash';
import {h} from 'ui/Framework';
import {hfill} from 'ui/Layout';
import * as K from 'utils/kefir';

/**
 * @ngdoc service
 * @name Collections/Selectors
 * @description
 * This module exports components allowing the user
 * to (un)assign entries from collections.
 */

/**
 * @ngdoc method
 * @name Collections/Selectors#sidebarSelector
 * @description
 * Selector displayed in the entity sidebar.
 *
 * @param {string} entryId
 * @param {Collections/Store} collectionsStore
 * @returns {VNode[]}
 */
export function sidebarSelector (entryId, collectionsStore) {
  return selector('bottom-left', K.constant([entryId]), collectionsStore);
}

/**
 * @ngdoc method
 * @name Collections/Selectors#bulkSelector
 * @description
 * Selector displayed for bulk list actions.
 *
 * @param {Kefir/Property} selectedIds$
 * @param {Collections/Store} collectionsStore
 * @returns {VNode[]}
 */
export function bulkSelector (selectedIds$, collectionsStore) {
  return selector('bottom-right', selectedIds$, collectionsStore);
}

function selector (menuAlignment, selectedIds$, collectionsStore) {
  const state$ = K.combineProperties([selectedIds$, collectionsStore.state$]);
  return state$.map(([entryIds, collections]) => {
    return h('div', {
      style: {marginRight: '2em'}
    }, [
      h('button.text-link', {
        cfContextMenuTrigger: true
      }, [ 'Add to collection' ]),
      h('.context-menu', {
        cfContextMenu: menuAlignment,
        role: 'menu'
      }, [
        h('div.context-menu__header', ['Collections'])
      ].concat(collections.map(({name, id}) => {
        if (allInCollection(collections, id, entryIds)) {
          return h('div', {
            role: 'menuitem',
            // Prevent dialog from closing with stopPropagation
            onClick: withStopPropagation(() => collectionsStore.removeItems(id, entryIds)),
            style: {display: 'flex'}
          }, [
            name,
            hfill(),
            h('i.fa.fa-check')
          ]);
        } else {
          return h('div', {
            role: 'menuitem',
            // Prevent dialog from closing with stopPropagation
            onClick: withStopPropagation(() => collectionsStore.addItems(id, entryIds))
          }, [name]);
        }
      })).concat([
        h('div', {
          role: 'menuitem',
          onClick: () => collectionsStore.requestCreate(entryIds)
        }, [
          h('span.text-link', ['Create collection'])
        ])
      ]))
    ]);
  });
}

function allInCollection (collections, collectionId, itemIds) {
  const collection = find(collections, (c) => c.id === collectionId);
  if (collection) {
    return itemIds.every((id) => includes(collection.items, id));
  }
}

// TODO should be part of framework utils
function withStopPropagation (fn) {
  return function (e) {
    e.stopPropagation();
    fn(e);
  };
}
