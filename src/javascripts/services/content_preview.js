'use strict';

/**
 * @ngdoc service
 * @name contentPreview
 * @description
 * This service fetches, caches and exposes data and helper functions relating to Content Preview
 */
angular.module('contentful')
.factory('contentPreview', ['require', function (require) {
  var $q = require('$q');
  var TheLocaleStore = require('TheLocaleStore');
  var spaceContext = require('spaceContext');
  var previewEnvironmentsCache = require('data/previewEnvironmentsCache');
  var getStore = require('TheStore').getStore;
  var store = getStore();

  var ENTRY_ID_PATTERN = /\{\s*entry_id\s*\}/g;
  var ENTRY_FIELD_PATTERN = /\{\s*entry_field\.(\w+)\s*\}/g;

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
  // https://contentful.atlassian.net/wiki/spaces/PROD/pages/204079331/The+example+app+-+Documentation+of+functionality
  var REFERENCES_PATTERN = /{references\.([a-z]+?\.[a-z]+?):?(\.?\w+?)*\}/g;
  var MAX_PREVIEW_ENVIRONMENTS = 25;
  var STORE_KEY = 'selectedPreviewEnvsForSpace.' + spaceContext.getId();

  return {
    getAll: getAll,
    get: get,
    getForContentType: getForContentType,
    canCreate: canCreate,
    create: create,
    update: update,
    remove: remove,
    new: makeNew,
    toInternal: toInternal,
    getInvalidFields: getInvalidFields,
    replaceVariablesInUrl: replaceVariablesInUrl,
    urlFormatIsValid: urlFormatIsValid,
    getSelected: getSelected,
    setSelected: setSelected
  };

  /**
   * @ngdoc method
   * @name contentPreview#getSelected
   * @param {string} contentTypeId
   * @returns {string|undefined}
   *
   * @description
   * Returns the ID for the last selected environment for the provided content type.
   * Fetches data from the store each time. Returns undefined if none is available.
  */
  function getSelected (contentTypeId) {
    var environmentsMap = store.get(STORE_KEY);
    return _.get(environmentsMap, contentTypeId);
  }

  /**
   * @ngdoc method
   * @name contentPreview#setSelected
   * @param {object} environment
   * @returns undefined
   *
   * @description
   * Sets the provided environment as the last selected one for that content type.
  */
  function setSelected (environment) {
    var environments = store.get(STORE_KEY) || {};
    environments[environment.contentType] = environment.envId;
    store.set(STORE_KEY, environments);
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
  function getAll () {
    if (previewEnvironmentsCache.getAll()) {
      return $q.resolve(previewEnvironmentsCache.getAll());
    } else {
      return spaceContext.space.endpoint('preview_environments').get()
      .then(function (environments) {
        return cachePreviewEnvironments(environments.items);
      });
    }
  }

  function cachePreviewEnvironments (environments) {
    var cacheVal = {};
    environments.forEach(function (environment) {
      cacheVal[environment.sys.id] = environment;
    });
    return previewEnvironmentsCache.setAll(cacheVal);
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
  function get (id) {
    return getAll().then(function (environments) {
      return environments[id] || $q.reject('Preview environment could not be found');
    });
  }

  /**
   * @ngdoc method
   * @name contentPreview#canCreate
   * @returns {Promise<boolean>}
   *
   * @description
   * Resolves to true if the user has less than 25 preview environments
   * and can thus still create more.
  */
  function canCreate () {
    return getAll().then(function (environments) {
      return Object.keys(environments).length < MAX_PREVIEW_ENVIRONMENTS;
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
  function getForContentType (ctId) {
    return getAll().then(_.partialRight(getEnvsForContentType, ctId));
  }

  function getEnvsForContentType (environments, ctId) {
    return _.transform(_.cloneDeep(environments), function (acc, env, envId) {
      var config = _.find(
        env.configurations,
        _.matches({'contentType': ctId})
      );
      if (config && config.enabled) {
        acc.push(_.extend(config, {name: env.name, envId: envId}));
      }
    }, []);
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
  function create (env) {
    var external = toExternal(env);
    return spaceContext.space.endpoint('preview_environments')
    .payload(external).post().then(updateCache);
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
  function update (env) {
    var external = toExternal(env);
    var headers = {'X-Contentful-Version': env.version};
    return spaceContext.space.endpoint('preview_environments', env.id)
    .headers(headers).payload(external).put()
    .then(updateCache);
  }

  function updateCache (env) {
    return previewEnvironmentsCache.set(env);
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
  function remove (env) {
    if (!env) {
      return $q.reject('No environment specified for deletion');
    }

    return spaceContext.space.endpoint('preview_environments', env.id).delete()
    .then(function () {
      previewEnvironmentsCache.clearAll();
    });
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
  function toExternal (internal) {
    return {
      name: internal.name,
      description: internal.description,
      configurations: _.reduce(internal.configs, function (acc, config) {
        if (config.url) {
          acc.push(_.pick(config, ['contentType', 'url', 'enabled', 'example']));
        }
        return acc;
      }, [])
    };
  }

  function getDefaultConfig (ct) {
    return {
      name: ct.name || 'Untitled',
      contentType: ct.sys.id,
      url: '',
      enabled: false,
      contentTypeFields: _.map(ct.fields, function (field) {
        return _.pick(field, ['apiName', 'type']);
      })
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
  function makeNew (contentTypes) {
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
  function toInternal (external, contentTypes) {
    function getConfigs () {
      return contentTypes.map(function (ct) {
        var config = _.find(
          external.configurations,
          _.matches({'contentType': ct.sys.id})
        ) || {};
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
  function getInvalidFields (url, fields) {
    var tokens = extractFieldTokensFromUrl(url);

    var objectFields = _.map(_.filter(fields, function (field) {
      return _.includes(['Array', 'Link', 'Object', 'Location'], field.type);
    }), 'apiName');

    var nonExistentFields = _.difference(tokens, _.map(fields, 'apiName'));
    var invalidTypeFields = _.intersection(tokens, objectFields);

    return {
      nonExistentFields: nonExistentFields,
      invalidTypeFields: invalidTypeFields
    };
  }

  function extractFieldTokensFromUrl (url) {
    var tokens = [];
    var match;

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
  function replaceVariablesInUrl (urlTemplate, entry, contentType) {
    var defaultLocale = TheLocaleStore.getDefaultLocale().internal_code;
    var processedUrl = urlTemplate
    .replace(ENTRY_ID_PATTERN, entry.sys.id)
    .replace(ENTRY_FIELD_PATTERN, function (match, fieldId) {
      var internalId = _.get(
        _.find(
          contentType.fields,
          _.matches({'apiName': fieldId})
        ), 'id'
      );
      var fieldValue = _.get(entry, ['fields', internalId, defaultLocale]);
      return _.toString(fieldValue) || match;
    });

    return resolveReferences({ url: processedUrl, entry: entry, defaultLocale: defaultLocale });
  }

  /**
   * @description function to resolve all references in content preview url
   * all references are resolved one-by-one, starting from the last (the most "right")
   * they are named, and you can use already resolved references in deeper. By default
   * you start with `current` entry. As an example:
   *
   *                `lesson` was resolved before                         `lesson` - new var
   * `/course/${references.lesson.course:fields.slug}/lessons/${references.current.lesson:fields.slug}`
   *
   * By default, it will resolve to `sys.id` value of the reference. However, you can provide
   * `:fields.slug` appendix, which will go and grab the value (in default locale) of the referenced entry
   * @param {Object} params
   * @param {string} params.url
   * @param {API.Entry} params.entry
   * @param {string} params.defaultLocale
   * @returns {Promise<string>} - url with resolved references (if any)
   */
  function resolveReferences (params) {
    var url = params.url;
    var entry = params.entry;
    var defaultLocale = params.defaultLocale;
    var references = url.match(REFERENCES_PATTERN);

    if (!references) {
      return Promise.resolve(url);
    }

    var promiseChain = Promise.resolve({
      // current is an id of the initial entry, which we edit
      // after iterating over references, new values will be added
      // to this object
      current: entry.sys.id,
      // we store all resolved values here, to replace in the url
      values: []
    });

    // we pop values from the array each step, so length of the array
    // goes down with each step
    while (references.length !== 0) {
      // IIFE to keep `reference` and `valuePath` in closure - we need to
      // get the value immediately, but it will be executed only after promise
      // resolving
      // after rewriting to ES6 we can just use `let`
      (function () {
        var referenceWithBraces = references.pop();
        // remove first and the last curly braces, and split access parts
        var wholeReference = referenceWithBraces.replace(/(^\{|\}$)/g, '').split(':');
        // reference is like `references.current.lesson`. It will get all entries which
        // this entry is linked to, choose the first, and assign it's value to the third
        // param (so `lesson` will have a new value, which is picked by valuePath)
        var reference = wholeReference[0];
        // valuePath shows how to get value we need in the url. Default value is `sys.id`.
        // value will be always taken in default locale
        var valuePath = wholeReference[1];

        // each "previous" reference get's resolved objects from all other references,
        // so we need to chain them.
        // this can be rewritten to generators afer switching to es6
        promiseChain = promiseChain.then(function (params) {
          var elements = reference.split('.');
          // since the structure is `references.current.lesson`, we need to get
          // the first element to get current ID
          var entryId = params[elements[1]];

          return spaceContext.cma.getEntries({
            // we are interested only in entries, where current entry is linked to it
            links_to_entry: entryId
          }).then(function (entries) {
            // this element could not exist, which is fine. we will receive an error,
            // which we handle in the `catch` clause
            var element = entries.items[0];
            // we need to resolve value, which we'll insert into URL after resolving all references
            // by default it is `sys.id`, but we use slugs in TEA
            var path = getValuePath({ defaultLocale: defaultLocale, valuePath: valuePath });
            var slugValue = _.get(element, path);
            // we still need actual ID, since we can resolve entries with linked entities by this ID
            var elementId = _.get(element, ['sys', 'id']);

            var newParams = {};
            // since the structure is `references.current.lesson`, we need to get
            // the last element to assign it to a variable
            newParams[elements[2]] = elementId;
            // we need to add this value to the end. Because we are popping references as well,
            // we'll end up with having first resolved reference as a last element
            newParams.values = params.values.concat(slugValue);

            return _.extend({}, params, newParams);
          });
        });
      })();
    }

    return promiseChain.then(function (params) {
      return url.replace(REFERENCES_PATTERN, function () {
        return params.values.pop();
      });
    }).catch(function () {
      // in case of failure, some references were not possible to resolve
      // so we can not create full URL, and in this case we just redirect
      // to the main page
      var baseUrl = url.match(/^https?:\/\/.+?\//);

      if (baseUrl) {
        return baseUrl[0];
      }
    });
  }

  /**
   * @description fn to retrieve value, which will be resolved and put into URL
   * by default it returns `sys.id` path, but in case we want to resolve some fields,
   * default locale's value will be retrieved
   * @param {Object} params
   * @param {string|undefined} params.valuePath - selector to get value
   * @param {string} params.defaultLocale
   * @returns {string[]} - selector to get value from entry
   */
  function getValuePath (params) {
    var valuePath = params.valuePath;
    var defaultLocale = params.defaultLocale;

    if (!valuePath) {
      return ['sys', 'id'];
    }

    var path = valuePath.split('.');

    if (path[0] === 'fields') {
      path.push(defaultLocale);
    }

    return path;
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
  function urlFormatIsValid (urlTemplate) {
    return /^https?:\/\/.+/.test(urlTemplate);
  }
}]);
