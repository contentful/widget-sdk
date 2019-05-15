import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { resolveReferences } from 'services/ContentPreviewHelper.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name contentPreview
   * @description
   * This service fetches, caches and exposes data and helper functions relating to Content Preview
   */
  registerFactory('contentPreview', [
    '$q',
    '$rootScope',
    'spaceContext',
    'TheLocaleStore',
    'data/Entries',
    'TheStore/index.es6',
    (
      $q,
      $rootScope,
      spaceContext,
      TheLocaleStore,
      { internalToExternal: internalToExternalFieldIds },
      { getStore }
    ) => {
      let cache;

      const store = getStore();

      const ENTRY_ID_PATTERN = /\{\s*entry_id\s*\}/g;
      const ENTRY_FIELD_PATTERN = /\{\s*entry_field\.(\w+)\s*\}/g;

      // this pattern is used for references resolving. It means that you can get entries,
      // which link the current one, and use it in the url.
      // the example syntax is:
      // `/course/{references.current.course}/lessons/{entry_id}`
      //
      // the replacer will find all entities which have current entry as a linked one,
      // pick the first, and insert `sys.id` value instead of `{references.current.course}`.
      // Also you can use several references, and the third argument (`course` in our case)
      // stores it's value, and you can use it in every reference on the left:
      // `/learning/{references.course.path}/courses/{references.current.course}/lessons/{entry_id}`
      //
      // This functionality is primarily needed for rich preview expirience for TEA (the example app):
      // https://contentful.atlassian.net/wiki/spaces/PROD/pages/204079331/The+example+app+-+Documentation+of+functionalityx

      // this number is hard coded on the UI and the limit does not exist in our backend.
      // the decision to have a limit comes from Product, and consists of having a better
      // control of overusage of our platform
      const MAX_PREVIEW_ENVIRONMENTS = 100;

      // we need to download content previews again after finishing with space template creation
      $rootScope.$on('spaceTemplateCreated', clearCache);

      return {
        getAll,
        clearCache,
        get,
        getForContentType,
        canCreate,
        create,
        update,
        remove,
        new: makeNew,
        toInternal,
        getInvalidFields,
        replaceVariablesInUrl,
        urlFormatIsValid,
        getSelected,
        setSelected,
        MAX_PREVIEW_ENVIRONMENTS
      };

      /**
       * @name contentPreview#getStoreKey
       * @returns {string}
       *
       * @description
       * Returns key for localstorage which is tied to current space
       */
      function getStoreKey() {
        return 'selectedPreviewEnvsForSpace.' + spaceContext.getId();
      }

      /**
       * @ngdoc method
       * @name contentPreview#getSelected
       * @returns {string|undefined}
       *
       * @description
       * Returns the ID for the last selected environment for currently active space.
       * Fetches data from the store each time. Returns undefined if none is available.
       */
      function getSelected() {
        const storeKey = getStoreKey();
        return store.get(storeKey);
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
        const storeKey = getStoreKey();
        store.set(storeKey, environment.envId);
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
          return $q.resolve(cache);
        } else {
          return spaceContext.space
            .endpoint('preview_environments')
            .payload({ limit: MAX_PREVIEW_ENVIRONMENTS })
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
        return getAll().then(
          environments => environments[id] || $q.reject('Preview environment could not be found')
        );
      }

      /**
       * @ngdoc method
       * @name contentPreview#canCreate
       * @returns {Promise<boolean>}
       *
       * @description
       * Resolves to true if the user has less than the max number of preview environments
       * and can thus still create more.
       */
      function canCreate() {
        return getAll().then(
          environments => Object.keys(environments).length < MAX_PREVIEW_ENVIRONMENTS
        );
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
       * Creates the preview environment and updates the cached `previewEnvironments`
       */
      function create(env) {
        const external = toExternal(env);
        return spaceContext.space
          .endpoint('preview_environments')
          .payload(external)
          .post()
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
        return spaceContext.space
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
          return $q.reject('No environment specified for deletion');
        }

        return (
          spaceContext.space
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
            const config =
              _.find(external.configurations, _.matches({ contentType: ct.sys.id })) || {};
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
       * @name contentPreview#getInvalidFields
       * @param {string} url
       * @param {Array<string>} fields
       * @returns {Array<object>}
       *
       * @description
       * Returns a list containing any invalid field tokens in the config's URL structure
       */
      function getInvalidFields(url, fields) {
        const tokens = extractFieldTokensFromUrl(url);

        const objectFields = _.map(
          _.filter(fields, field =>
            _.includes(['Array', 'Link', 'Object', 'Location'], field.type)
          ),
          'apiName'
        );

        const nonExistentFields = _.difference(tokens, _.map(fields, 'apiName'));
        const invalidTypeFields = _.intersection(tokens, objectFields);

        return { nonExistentFields, invalidTypeFields };
      }

      function extractFieldTokensFromUrl(url) {
        const tokens = [];
        let match;

        do {
          match = ENTRY_FIELD_PATTERN.exec(url);
          if (match) {
            tokens.push(match[1]);
          }
        } while (match);

        return _.uniq(tokens);
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
       * Always uses the default locale value.
       */
      function replaceVariablesInUrl(urlTemplate, entry, contentType) {
        const defaultLocale = TheLocaleStore.getDefaultLocale().code;
        const processedUrl = urlTemplate
          .replace(ENTRY_ID_PATTERN, entry.sys.id)
          .replace(ENTRY_FIELD_PATTERN, (match, fieldId) => {
            const internalId = _.get(
              _.find(contentType.fields, _.matches({ apiName: fieldId })),
              'id'
            );

            if (!_.has(entry, ['fields', internalId])) {
              return match;
            }

            const fieldValue = _.get(entry, ['fields', internalId, defaultLocale]);

            return _.toString(fieldValue);
          });

        return resolveReferences({
          cma: spaceContext.cma,
          url: processedUrl,
          entry: internalToExternalFieldIds(entry, contentType),
          defaultLocale
        });
      }

      /**
       * @ngdoc method
       * @name contentPreview#urlFormatIsValid
       * @param {string} urlTemplate
       * @returns {boolean}
       *
       * @description
       * Validates the provided URL template and returns true if valid.
       */
      function urlFormatIsValid(urlTemplate) {
        return /^https?:\/\/.+/.test(urlTemplate);
      }
    }
  ]);
}
