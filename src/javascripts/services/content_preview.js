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

  var ENTRY_ID_PATTERN = /\{\s*entry_id\s*\}/g;
  var ENTRY_FIELD_PATTERN = /\{\s*entry_field\.(\w+)\s*\}/g;
  var MAX_PREVIEW_ENVIRONMENTS = 25;

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
    urlFormatIsValid: urlFormatIsValid
  };

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
   * @param {object} contentType
   * @returns {Promise<environments>}
   *
   * @description
   * Loads the list of preview environments for a specific content type.
   * Uses #getAll method to load environment list from server or cache.
  */
  function getForContentType (contentType) {
    var contentTypeId = contentType.getId();
    return getAll()
    .then(function (environments) {
      return _.reduce(_.cloneDeep(environments), function (acc, env) {
        var config = _.find(
          env.configurations,
          _.matches({'contentType': contentTypeId})
        );
        if (config) {
          config.name = env.name;
          acc.push(config);
        }
        return acc;
      }, []);
    });
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
      name: ct.getName(),
      contentType: ct.getId(),
      url: '',
      enabled: false,
      contentTypeFields: _.map(ct.data.fields, function (field) {
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
          _.matches({'contentType': ct.getId()})
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
      return _.includes(['Array', 'Link', 'Object'], field.type);
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
   * @param {Entry} entry
   * @param {ContentType} contentType
   * @returns {string} url
   *
   * @description
   * Returns the compiled URL with the entry data.
   * Entry ID and field tokens are substituted for the actual values for that entry.
   * Always uses the default locale value.
  */
  function replaceVariablesInUrl (urlTemplate, entry, contentType) {
    var defaultLocale = TheLocaleStore.getDefaultLocale().code;
    return urlTemplate
    .replace(ENTRY_ID_PATTERN, entry.getId())
    .replace(ENTRY_FIELD_PATTERN, function (match, fieldId) {
      var internalId = _.get(
        _.find(
          contentType.data.fields,
          _.matches({'apiName': fieldId})), 'id'
        );
      return _.get(entry, ['data', 'fields', internalId, defaultLocale]) || match;
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
  function urlFormatIsValid (urlTemplate) {
    return /^[A-z][A-z\d+-.]*:\/\/.+\..+/.test(urlTemplate);
  }

}]);
