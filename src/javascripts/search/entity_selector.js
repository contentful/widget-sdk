'use strict';

/**
 * @ngdoc service
 * @name entitySelector
 * @description
 * Opens a modal window for entity selection.
 */
angular.module('contentful')
.factory('entitySelector', ['require', require => {
  var modalDialog = require('modalDialog');
  var spaceContext = require('spaceContext');
  var ListQuery = require('ListQuery');
  var $q = require('$q');
  var assetContentType = require('assetContentType');
  var mimetype = require('mimetype');
  var TheLocaleStore = require('TheLocaleStore');

  var LABELS = {
    entry_single: {
      title: 'Insert existing entry',
      input: 'Search for an entry:',
      info: 'You can insert only one entry. Click on any entry to insert it.',
      empty: 'No entries',
      searchPlaceholder: 'Search %total% entries'
    },
    entry_multiple: {
      title: 'Insert existing entries',
      input: 'Search for entries:',
      selected: 'selected entries',
      empty: 'No entries',
      insert: 'Insert selected entries',
      searchPlaceholder: 'Search %total% entries'
    },
    asset_single: {
      title: 'Insert existing asset',
      input: 'Search for a media asset:',
      info: 'You can insert only one asset. Click on any asset to insert it.',
      empty: 'No assets',
      searchPlaceholder: 'Search %total% assets'
    },
    asset_multiple: {
      title: 'Insert existing assets',
      input: 'Search for assets:',
      selected: 'selected assets',
      empty: 'No assets',
      insert: 'Insert selected assets',
      searchPlaceholder: 'Search %total% assets'
    },
    user_multiple: {
      title: 'Insert existing users',
      input: 'Select users',
      selected: 'selected users',
      empty: 'No users',
      insert: 'Insert selected users',
      searchPlaceholder: 'Search %total% users in your organization'
    }
  };

  return {
    openFromField: openFromField,
    openFromExtension: openFromExtension,
    open: open
  };

  /**
   * @ngdoc method
   * @name entitySelector#open
   * @param {Object} config
   * {
   *   locale: {String},
   *   multiple: {Boolean},
   *   max: {Number?}, // for multiple=true
   *   min: {Number?}, // for multiple=true
   *   entityType: {String},
   *   linkedContentTypeIds: {Array?},
   *   linkedMimetypeGroups: {Array?},
   *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>},
   *   scope: {Object}, // other scope data that could be needed in custom html in `.labels`
   *   labels: {
   *     title: {String},
   *     input: {String},
   *     info: {String?}, // for multiple=false
   *     infoHtml: {String?}, // for multiple=false, can be used instead of `.info`
   *     selected: {String}, // for multiple=true
   *     empty: {String},
   *     noEntitiesCustomHtml: {String?} // custom html for the whole dialog when there are no entities
   *     insert: {String},
   *     searchPlaceholder: {String}
   *   }
   * }
   * @returns {Promise<API.Entity[]>}
   * @description
   * Opens a modal for the provided custom config object
   */
  function open (config) {
    var entitySelectorControllerConfig = _.omit(config, 'scope', 'labels');
    var scopeData = _.extend({}, config.scope, {
      config: entitySelectorControllerConfig,
      labels: _.extend(getLabels(config), config.labels),
      listHeight: getListHeight()
    });
    return modalDialog.open({
      template: 'entity_selector_dialog',
      backgroundClose: false,
      ignoreEsc: true,
      noNewScope: true,
      scopeData: scopeData
    }).promise;
  }

  /**
   * @ngdoc method
   * @name entitySelector#openFromField
   * @param {API.Field} field
   * @param {number?} currentSize
   *   Current number of entities on the field. Used to calculate the
   *   number of entities that can be selected if there are size
   *   validations. Defaults to zero.
   * @returns {Promise<API.Entity[]>}
   * @description
   * Opens a modal for the provided reference
   * field and optional list of existing links.
   */
  function openFromField (field, currentSize) {
    return newConfigFromField(field, currentSize || 0).then(open);
  }

  /**
   * @ngdoc method
   * @name entitySelector#openFromExtension
   * @param {string}   options.locale        Locale code to show entity description
   * @param {string}   options.entityType    "Entry" or "Asset"
   * @param {boolean}  options.multiple      Flag for turning on/off multiselection
   * @param {number}   options.min           Minimal number of selected entities
   * @param {number}   options.max           Maximal number of selected entities
   * @param {string[]} options.contentTypes  List of CT IDs to filter entries with
   * @returns {Promise<API.Entity[]>}
   * @description
   * Opens a modal for a configuration object
   * coming from the extension SDK "dialogs"
   * namespace.
   */
  function openFromExtension (options) {
    return newConfigFromExtension(options)
      .then(open)
      .then(selected => // resolve with a single object if selecting only
    // one entity, resolve with an array otherwise
    (options.multiple ? selected : selected[0]), err => // resolve with `null` if a user skipped selection,
    // reject with an error otherwise
    (err ? $q.reject(err) : null));
  }

  function getListHeight () {
    var height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var listHeight = height - 350;

    if (listHeight < 200) {
      return 200;
    } else if (listHeight > 500) {
      return 500;
    } else {
      return listHeight;
    }
  }

  /**
   * Builds a config for #openFromField
   * @param {API.Field} field
   * @param {number?} currentSize
   * @returns config for #open
   */
  function newConfigFromField (field, currentSize) {
    field = field || {};

    var entityType = field.linkType || field.itemLinkType;
    var size = findValidation(field, 'size', {});
    var max = (size.max || +Infinity) - currentSize;
    var min = (size.min || 1) - currentSize;
    min = min < 1 ? 1 : min;

    var config = {
      scope: {},
      locale: field.locale,
      multiple: max !== min && field.type === 'Array',
      max: max,
      min: min,
      entityType: entityType,
      linkedContentTypeIds: findLinkValidation(field, 'linkContentType'),
      linkedMimetypeGroups: findLinkValidation(field, 'linkMimetypeGroup')

      // @todo see comments in "prepareQueryExtension"
      // linkedFileSize: findValidation(field, 'assetFileSize', {}),
      // linkedImageDimensions: findValidation(field, 'assetImageDimensions', {})
    };
    config.fetch = makeFetch(config);

    return getSingleContentType(config).then(singleContentType => {
      config.scope.singleContentType = singleContentType;
      return config;
    });
  }


  /**
   * Builds a config for #openFromExtension
   * @param {object} options
   * @returns Promise<object> resolves with config for #open
   */
  function newConfigFromExtension (options) {
    options = options || {};
    var config = _.pick(options, ['locale', 'multiple', 'min', 'max', 'entityType']);

    config = _.extend(config, {
      scope: {},
      locale: config.locale || TheLocaleStore.getDefaultLocale().code,
      linkedContentTypeIds: options.contentTypes || [],
      linkedMimetypeGroups: []
    });
    config.fetch = makeFetch(config);

    return getSingleContentType(config).then(singleContentType => {
      config.scope.singleContentType = singleContentType;
      return config;
    });
  }

  /**
   * Creates fetch function for Entity and Asset entity types
   *
   * @TODO move fetch logic for entries and assets to EntitySelectorController
   * or separate module.
   */
  function makeFetch (config) {
    if (['Entry', 'Asset'].indexOf(config.entityType) < 0) {
      throw new Error('Unsupported entity type: \'' + config.entityType + '\'.');
    }
    var fnName = 'get' + getEntityTypePlural(config.entityType);
    var queryMethod = 'getFor' + getEntityTypePlural(config.entityType);
    var queryExtension = prepareQueryExtension(config);

    return params => ListQuery[queryMethod](params).then(query => {
      query = _.extend(query, queryExtension);
      return spaceContext.cma[fnName](query);
    });
  }

  function getEntityTypePlural (singular) {
    return {
      'Asset': 'Assets',
      'Entry': 'Entries'
    }[singular];
  }

  function findLinkValidation (field, property) {
    var found = findValidation(field, property, []);

    return _.isString(found) ? [found] : found;
  }

  function findValidation (field, property, defaultValue) {
    var validations = [].concat(field.validations || [], field.itemValidations || []);
    var found = _.find(validations, v => _.isObject(v[property]) || _.isString(v[property]));

    return (found && found[property]) || defaultValue;
  }

  function getSingleContentType (config) {
    if (config.entityType === 'Asset') {
      return $q.resolve(assetContentType);
    }

    var linked = config.linkedContentTypeIds;
    if (config.entityType === 'Entry' && linked.length === 1) {
      return spaceContext.publishedCTs.fetch(linked[0]);
    }

    return $q.resolve(null);
  }

  function prepareQueryExtension (config) {
    var extension = {};

    if (config.entityType === 'Entry') {
      var ids = config.linkedContentTypeIds;
      if (Array.isArray(ids) && ids.length > 1) {
        extension['sys.contentType.sys.id[in]'] = ids.join(',');
      }
    }

    if (config.entityType === 'Asset') {
      var groups = config.linkedMimetypeGroups;
      if (Array.isArray(groups) && groups.length > 0) {
        extension['fields.file.contentType[in]'] = _.reduce(groups, (cts, group) => cts.concat(mimetype.getTypesForGroup(group)), []).join(',');
      }

      // @todo there are multiple BE problems that need to be solved first;
      // see these Target Process tickets:
      // - https://contentful.tpondemand.com/entity/11408
      // - https://contentful.tpondemand.com/entity/8030
      // for now we don't want to apply size constraints so behavior
      // of the reference widget doesn't change

      // applySizeConstraint('fields.file.details.size', config.linkedFileSize);
      // applySizeConstraint('fields.file.details.width', config.linkedImageDimensions.width);
      // applySizeConstraint('fields.file.details.height', config.linkedImageDimensions.height);
    }

    return extension;

    // function applySizeConstraint (path, constraint) {
    //   constraint = _.isObject(constraint) ? constraint : {};
    //   if (constraint.min) {
    //     extension[path + '[gte]'] = constraint.min;
    //   }
    //   if (constraint.max) {
    //     extension[path + '[lte]'] = constraint.max;
    //   }
    // }
  }

  function getLabels (config) {
    var key = [
      config.entityType.toLowerCase(),
      (config.multiple ? 'multiple' : 'single')
    ].join('_');

    return _.clone(LABELS[key] || {});
  }
}]);
