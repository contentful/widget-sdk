import qs from 'qs';
import { getStore } from 'TheStore';
import { omit, isEmpty } from 'lodash';
import { serialize, unserialize } from 'data/ViewSerializer';
import { getQueryString } from 'utils/location';

const STORE_PREFIX = 'lastFilterQueryString';

const getEntityKey = entityType => {
  const entityKey = { Entry: 'entries', Asset: 'assets' }[entityType];

  if (typeof entityKey === 'string') {
    return entityKey;
  }

  throw new Error(`Cannot create a view persistor for ${entityType}.`);
};

/**
 * Create a view persistor. Used on both entry and asset list.
 *
 * Views are persisted to the location query string and local storage.
 * They are also read from both with the query string taking
 * precedence.
 */
export default function create({ entityType, spaceId, $location }) {
  const store = getStore().forKey([STORE_PREFIX, getEntityKey(entityType), spaceId].join('.'));

  return { read, save };

  function save(view) {
    const viewData = serialize(omitUIConfigOnlyViewProperties(view));
    store.set(viewData);
    $location.search(prepareQueryString(viewData));
    $location.replace();
  }

  function read() {
    const currentQS = getQueryString();
    const previousQS = store.get() || {};
    const viewData = isEmpty(currentQS) ? previousQS : currentQS;
    const view = omitUIConfigOnlyViewProperties(unserialize(viewData)) || {};

    // For "contentTypeHidden" we cast a string value to a boolean:
    // - An undefined value is retained.
    // - The string "false" is casted to false.
    // - Everything else is casted to true.
    const contentTypeHidden = view.contentTypeHidden;
    if (contentTypeHidden !== undefined) {
      view.contentTypeHidden = contentTypeHidden.toString() !== 'false';
    }

    return view;
  }
}

function omitUIConfigOnlyViewProperties(view) {
  return omit(view, ['title', '_legacySearchTerm']);
}

function prepareQueryString(viewData) {
  const qsObject = Object.keys(viewData)
    .filter(key => !key.startsWith('_'))
    .reduce((acc, key) => ({ ...acc, [key]: viewData[key] }), {});

  // We use the "repeat" array format option so:
  // stringify({x: [1, 2]}) // results in: 'x=1&x=2'
  //
  // This format is used in entity list query strings
  // for historical reasons.
  return qs.stringify(qsObject, { arrayFormat: 'repeat' });
}
