import _ from 'lodash';
import { resolveReferences } from 'services/ContentPreviewHelper.es6';
import { getStore } from 'TheStore/index.es6';

export const ENTRY_ID_PATTERN = /\{\s*entry_id\s*\}/g;
export const ENTRY_FIELD_PATTERN = /\{\s*entry_field\.(\w+)\s*\}/g;

export const VALID_URL_PATTERN = /^https?:\/\/.+/;

// The number was arbitrarily selected by the Product.
// TODO: there's no backend enforcement.
const CONTENT_PREVIEW_LIMIT = 100;

/**
 * @ngdoc service
 * @name contentPreview
 * @description
 * This service fetches, caches and exposes data and helper functions relating to Content Preview
 *
 * TODO: "preview environment" is the old name; we should phase it out ("Environments" are
 * a completely different feature) and replace with "content preview".
 * TODO: we operate on "internal" and "external" versions of the entity; we should use API
 * entities only, also for rendering views.
 * TODO: add methods for subscribing to the currently selected content preview.
 */
export default function create({ space, cma }) {
  let cache;
  const store = getStore();

  return {
    getAll,
    clearCache,
    get,
    getForContentType,
    create,
    update,
    remove,
    new: makeNew,
    toInternal,
    replaceVariablesInUrl,
    getSelected,
    setSelected
  };

  /**
   * @name contentPreview#getStoreKey
   * @returns {string}
   *
   * @description
   * Returns key for localstorage which is tied to current space
   */
  function getStoreKey() {
    return `selectedPreviewEnvsForSpace.${space.data.sys.id}`;
  }

  /**
   * @ngdoc method
   * @name contentPreview#getSelected
   * @returns {string|null}
   *
   * @description
   * Returns the ID for the last selected environment for currently active space.
   * Fetches data from the store each time. Returns null if none was set yet.
   */
  function getSelected() {
    return store.get(getStoreKey());
  }

  /**
   * @ngdoc method
   * @name contentPreview#setSelected
   * @param {object} environment
   * @returns undefined
   *
   * @description
   * Sets the provided environment as the last selected one for currently active space.
   */
  function setSelected(environment) {
    store.set(getStoreKey(), environment.envId);
  }

  /**
   * @ngdoc method
   * @name contentPreview#getAll
   * @returns {Promise<environments>}
   *
   * @description
   * Loads the list of preview environments.
   * Uses cached version if available, otherwise fetches from server and caches response.
   */
  function getAll() {
    if (cache) {
      return Promise.resolve(cache);
    } else {
      return space
        .endpoint('preview_environments')
        .payload({ limit: CONTENT_PREVIEW_LIMIT })
        .get()
        .then(environments => cachePreviewEnvironments(environments.items));
    }
  }

  function cachePreviewEnvironments(environments) {
    const cacheVal = {};
    environments.forEach(environment => {
      cacheVal[environment.sys.id] = environment;
    });
    cache = cacheVal;
    return cache;
  }

  function clearCache() {
    cache = undefined;
  }

  /**
   * @ngdoc method
   * @name contentPreview#get
   * @param {string} id
   * @returns {Promise<environment>}
   *
   * @description
   * Loads a single preview environment.
   * Uses #getAll method to load environment list from server or cache.
   */
  function get(id) {
    return getAll().then(environments => {
      return environments[id] || Promise.reject('Preview environment could not be found');
    });
  }

  /**
   * @ngdoc method
   * @name contentPreview#getForContentType
   * @param {string} contentTypeId
   * @returns {Promise<environments>}
   *
   * @description
   * Loads the list of preview environments for a specific content type.
   * Uses #getAll method to load environment list from server or cache.
   */
  function getForContentType(ctId) {
    return getAll().then(_.partialRight(getEnvsForContentType, ctId));
  }

  function getEnvsForContentType(environments, ctId) {
    return _.transform(
      _.cloneDeep(environments),
      (acc, env, envId) => {
        const config = _.find(env.configurations, _.matches({ contentType: ctId }));
        if (config && config.enabled) {
          acc.push(_.extend(config, { name: env.name, envId: envId }));
        }
      },
      []
    );
  }

  /**
   * @ngdoc method
   * @name contentPreview#create
   * @param {object} environment
   * @returns {Promise<environment>}
   *
   * @description
   * Creates the preview environment and updates the cache.
   */
  function create(env) {
    return getAll()
      .then(environments => {
        const canCreate = Object.keys(environments).length < CONTENT_PREVIEW_LIMIT;

        if (!canCreate) {
          return Promise.reject(`Cannot create more than ${CONTENT_PREVIEW_LIMIT} previews.`);
        }

        return space
          .endpoint('preview_environments')
          .payload(toExternal(env))
          .post();
      })
      .then(updateCache);
  }

  /**
   * @ngdoc method
   * @name contentPreview#update
   * @param {object} environment
   * @returns {Promise<environment>}
   *
   * @description
   * Updates the preview environment and updates the cached `previewEnvironments`
   */
  function update(env) {
    const external = toExternal(env);
    const headers = { 'X-Contentful-Version': env.version };
    return space
      .endpoint('preview_environments', env.id)
      .headers(headers)
      .payload(external)
      .put()
      .then(updateCache);
  }

  function updateCache(env) {
    cache = cache || {};
    cache[env.sys.id] = env;
    return env;
  }

  /**
   * @ngdoc method
   * @name contentPreview#remove
   * @param {object} environment
   * @returns {Promise<void>}
   *
   * @description
   * Deletes the preview environment and updates the cached `previewEnvironments`
   */
  function remove(env) {
    if (!env) {
      return Promise.reject('No environment specified for deletion');
    }

    return (
      space
        .endpoint('preview_environments', env.id)
        .delete()
        // We first clear the whole cache then we repopulate the cache.
        .then(() => {
          clearCache();
          return getAll();
        })
        // This method, historically, resolves with nothing.
        .then(() => {})
    );
  }

  /**
   * @ngdoc method
   * @name contentPreview#toExternal
   * @param {object} internal
   * @returns {object}
   *
   * @description
   * Convert preview environment from internal to external format.
   * Removes any configs with empty URLs from the list.
   */
  function toExternal(internal) {
    return {
      name: internal.name,
      description: internal.description,
      configurations: _.reduce(
        internal.configs,
        (acc, config) => {
          if (config.url) {
            acc.push(_.pick(config, ['contentType', 'url', 'enabled', 'example']));
          }
          return acc;
        },
        []
      )
    };
  }

  function getDefaultConfig(ct) {
    return {
      name: ct.name || 'Untitled',
      contentType: ct.sys.id,
      url: '',
      enabled: false,
      contentTypeFields: _.map(ct.fields, field => _.pick(field, ['apiName', 'type']))
    };
  }

  /**
   * @ngdoc method
   * @name contentPreview#new
   * @param {Array<ContentType>} contentTypes
   * @returns {object} environment
   *
   * @description
   * Returns a new content preview environment based on the content types in the space.
   */
  function makeNew(contentTypes) {
    return {
      configs: contentTypes.map(getDefaultConfig)
    };
  }

  /**
   * @ngdoc method
   * @name contentPreview#toInternal
   * @param {object} external
   * @param {Array<ContentType>} contentTypes
   * @returns {object}
   *
   * @description
   * Converts a preview environment object from external to internal format.
   */
  function toInternal(external, contentTypes) {
    function getConfigs() {
      return contentTypes.map(ct => {
        const config = _.find(external.configurations, _.matches({ contentType: ct.sys.id })) || {};
        return _.defaults(config, getDefaultConfig(ct));
      });
    }

    return {
      name: external.name,
      description: external.description,
      configs: getConfigs(),
      version: external.sys.version,
      id: external.sys.id
    };
  }

  /**
   * @ngdoc method
   * @name contentPreview#replaceVariablesInUrl
   * @param {string} urlTemplate
   * @param {API.Entry} entry
   * @param {API.ContentType} contentType
   * @returns {Promise<string>} url
   *
   * @description
   * Returns the compiled URL with the entry data.
   * Entry ID and field tokens are substituted for the actual values for that entry.
   * Both `entry` and `localeCode` use public IDs.
   */
  function replaceVariablesInUrl(urlTemplate, entry, localeCode) {
    const processedUrl = urlTemplate
      .replace(ENTRY_ID_PATTERN, entry.sys.id)
      .replace(ENTRY_FIELD_PATTERN, (match, fieldId) => {
        if (!_.has(entry, ['fields', fieldId])) {
          return match;
        }

        const fieldValue = _.get(entry, ['fields', fieldId, localeCode]);

        return _.toString(fieldValue);
      });

    return resolveReferences({
      cma,
      entry,
      localeCode,
      url: processedUrl
    });
  }
}
