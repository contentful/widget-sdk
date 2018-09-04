/**
 * This module exports a factory for creating the refernce editor
 * state.
 *
 * The state connects to the entity field API for a reference field (as
 * defined by the field editor extensions API) and uses a space client
 * instance.
 *
 * The state’s output is the `entities$` property which emits a list of
 * `[id, entity]` pairs. Whenever the list of links on a field changes
 * we load the corresponding entity data from the API and emit a new
 * list from `entities$`.
 *
 * The state also provides setter methods that sync the value to the
 * field API and also emit a new array on `entities$`.
 *
 * This module is covered by the 'cfReferenceEditor' directive tests.
 */
import { get } from 'utils/Collections.es6';
import * as K from 'utils/kefir.es6';
import * as EntityResolver from 'data/CMA/EntityResolver.es6';
import { isEqual, isString } from 'lodash';

/**
 * @param {object} field
 *   An instance of a field object as defined by the UI extensions
 *   API.
 * @param {API.Client} space
 *   Same interface as defined by `data/ApiClient` and the `space`
 *   property on the UI Extensions API.
 * @param {string} type
 *   Either 'Entry' or 'Asset'
 * @param {boolean} single
 *   If true, the field value stores a single link.
 */
export function create(field, fieldValue$, space, type, single) {
  const store = EntityResolver.forType(type, space);
  const idsState = createIdsState(field, fieldValue$, single, type);

  const refreshBus = K.createPropertyBus();

  const entities$ = K.combine([idsState.ids$, refreshBus.property], (ids, _refreshed) => ids)
    .flatMapLatest(ids => K.fromPromise(store.load(ids)))
    .toProperty(() => null);

  return {
    /**
     * @description
     * Set the list of links on the field and also emit new entities.
     * @param {string[]} ids
     */
    setIds: idsState.set,
    /**
     * @description
     * Append the ids for the given entries and update the field
     * value. Also emits new entities but does not load the from the
     * API.
     * @param {API.Entity[]} entities
     */
    addEntities: addEntities,
    /**
     * @description
     * Reload the entitiy data and reemit it to entities$
     */
    refreshEntities: refreshEntities,
    /**
     * @description
     * Remove the link at the given index.
     * @param {number} index
     */
    removeAt: idsState.removeAt,
    /**
     * @type {Property<[string, API.Entity?]>}
     */
    entities$: entities$
  };

  function addEntities(entities) {
    entities.forEach(store.addEntity);
    idsState.add(entities.map(entity => entity.sys.id));
  }

  function refreshEntities() {
    store.reset();
    refreshBus.set();
  }
}

/**
 * A view for the IDs list of a field that stores links.
 *
 * TODO using the v3 API for field editor we should be able to simplify this.
 */
function createIdsState(field, fieldValue$, single, type) {
  const ids$ = fieldValue$.map(fromFieldValue);

  return {
    // string[] -> void
    set: set,
    // string[] -> void
    add: add,
    // number -> void
    removeAt: removeAt,
    // Property<string[]>
    ids$: ids$
  };

  function set(ids) {
    const current = fromFieldValue(field.getValue());
    if (isEqual(ids, current)) {
      return;
    }

    setFieldValue(ids);
  }

  function removeAt(index) {
    const current = fromFieldValue(field.getValue());
    current.splice(index, 1);
    set(current);
  }

  function add(ids) {
    const current = fromFieldValue(field.getValue());
    set(current.concat(ids));
  }

  function setFieldValue(ids) {
    let links = ids.map(id => ({
      sys: {
        id: id,
        linkType: type,
        type: 'Link'
      }
    }));

    if (links.length < 1) {
      field.removeValue();
    } else {
      links = single ? links[0] : links;
      field.setValue(links);
    }
  }

  function fromFieldValue(links) {
    if (!links) {
      links = [];
    } else if (single) {
      links = [links];
    }
    return links.map(link => {
      const id = get(link, ['sys', 'id']);

      return isString(id) ? id : null;
    });
  }
}
