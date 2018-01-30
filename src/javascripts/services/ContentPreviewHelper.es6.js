import { runTask } from 'utils/Concurrent';
import spaceContext from 'spaceContext';
import { get, reduce } from 'lodash';

export function resolveReferences (params) {
  return runTask(resolveReferences_, params);
}
/**
 * @description
 *
 * This function takes a preview url with placeholders, resolves incoming
 * references if needed and returns a compiled/interpolated url.
 * The workings are explained by inline comments.
 *
 * @param {Object} params
 * @param {string} params.url
 * @param {API.Entry} params.entry
 * @param {string} params.defaultLocale
 * @returns {Promise<string>} - url with resolved references (if any)
 */
function* resolveReferences_ ({url, entry, defaultLocale}) {
  // Pattern that denotes usage of incoming links
  const REFERENCES_PATTERN = /linkedBy/g;
  // Pattern to strip out the placeholders from the url
  const PLACEHOLDER_PATTERN = /\{.*?\}/g;

  /*
   * This does the following:
   *
   * Given url is "http://abc.com/{entry.linkedBy.linkedBy.fields.slug}/{entry.linkedBy.sys.id}/{entry.fields.slug}"
   *
   * We first get an array of placeholders:
   * ['{entry.linkedBy.linkedBy.fields.slug}', '{entry.linkedBy.sys.id}', '{entry.fields.slug}']
   *
   * Then, we count occurence of REFERENCES_PATTERN in each placeholder:
   * [2, 1, 0]
   *
   * Finally, we take the max of the count and then proceed to resolve `count` level
   * of incoming links to current entry.
   */
  const numberOfIncomingLinksToResolve = Math.max.apply(
    Math,
    url.match(PLACEHOLDER_PATTERN).map(m => (m.match(REFERENCES_PATTERN) || []).length)
  );

  if (numberOfIncomingLinksToResolve < 1) {
    return Promise.resolve(url);
  }

  // This object is what is used in the final interpolation
  // It also handles locales by converting entry.fields.slug to entry.fields[defaultLocale].slug
  const dataToInterpolate = createInterpolationDataObject(entry, defaultLocale);
  let currentEntry = dataToInterpolate;

  // eslint-disable-next-line no-restricted-syntax
  for (let i = 0; i < numberOfIncomingLinksToResolve; i += 1) {
    const linkedByEntries = yield spaceContext.cma.getEntries({
      // get the incoming links for the current entry
      links_to_entry: currentEntry.sys.id
    });
    const firstLinkedByEntry = get(linkedByEntries, 'items[0]', undefined);

    // fail early if there are no incoming links to the entry in questions
    if (!firstLinkedByEntry) {
      return url.match(/^https?:\/\/.+?\//)[0];
    } else {
      // add the incoming link to the current entry
      currentEntry.linkedBy = createInterpolationDataObject(firstLinkedByEntry, defaultLocale);
      // make current entry the first incoming one we resolved to and continue the process
      currentEntry = currentEntry.linkedBy;
    }
  }

  // Interpolate the placeholders with the actual data from the data object we just built
  return url.replace(/\{entry\.(.+?)\}/g, function (_match, path) {
    return get(dataToInterpolate, path || '', path + '_ NOT_FOUND');
  });
}

/**
 * @description
 *
 * Create an object that mimics the shape of an entry but has
 * defaultLocale data only and a linkedBy property which holds
 * the first incoming link to the top level entry.
 *
 * @param {API.entry} entry
 * @param {string} defaultLocale
 * @returns {Object}
 */
function createInterpolationDataObject (entry, defaultLocale) {
  const entryFields = reduce(entry.fields, function (acc, fieldData, fieldName) {
    acc[fieldName] = fieldData[defaultLocale];
    return acc;
  }, {});

  return Object.defineProperties({}, {
    fields: {
      enumerable: true,
      value: entryFields
    },
    sys: {
      enumerable: true,
      value: entry.sys
    },
    linkedBy: {
      enumerable: true,
      value: null,
      writable: true
    }
  });
}
