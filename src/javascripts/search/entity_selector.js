'use strict';

/**
 * @ngdoc service
 * @name entitySelector
 * @description
 * Opens a modal window for entity selection.
 */
angular.module('contentful')
.factory('entitySelector', ['require', function (require) {

  var modalDialog = require('modalDialog');
  var spaceContext = require('spaceContext');
  var $q = require('$q');
  var assetContentType = require('assetContentType');
  var mimetype = require('mimetype');
  var TheLocaleStore = require('TheLocaleStore');

  var LABELS = {
    entry_single: {
      title: 'Insert existing entry',
      input: 'Search for an entry:',
      info: 'You can insert only one entry. Click on any entry to insert it.',
      empty: 'No entries'
    },
    entry_multiple: {
      title: 'Insert existing entries',
      input: 'Search for entries:',
      selected: 'selected entries',
      empty: 'No entries'
    },
    asset_single: {
      title: 'Insert existing asset',
      input: 'Search for a media asset:',
      info: 'You can insert only one asset. Click on any asset to insert it.',
      empty: 'No assets'
    },
    asset_multiple: {
      title: 'Insert existing assets',
      input: 'Search for assets:',
      selected: 'selected assets',
      empty: 'No assets'
    }
  };

  return {
    open: openFromField,
    openFromExtension: openFromExtension
  };

  /**
   * @ngdoc method
   * @name entitySelector#open
   * @param {API.Field} field
   * @param {API.Link[]?} links
   * @returns {Promise<API.Entity[]>}
   * @description
   * Opens a modal for the provided reference
   * field and optional list of existing links.
   */
  function openFromField (field, links) {
    return open(prepareFieldConfig(field, links));
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
    return open(prepareExtensionConfig(options))
    .then(function (selected) {
      // resolve with a single object if selecting only
      // one entity, resolve with an array otherwise
      return options.multiple ? selected : selected[0];
    }, function (err) {
      // resolve with `null` if a user skipped selection,
      // reject with an error otherwise
      return err ? $q.reject(err) : null;
    });
  }

  function open (config) {
    if (!config.linksEntry && !config.linksAsset) {
      return $q.reject(new Error('Provide a valid configuration object.'));
    }

    return getSingleContentType(config)
    .then(function openDialog (singleContentType) {
      return modalDialog.open({
        template: 'entity_selector_dialog',
        ignoreEsc: true,
        noNewScope: true,
        scopeData: {
          config: config,
          labels: getLabels(config),
          singleContentType: singleContentType,
          listHeight: getListHeight()
        }
      }).promise;
    });
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

  function prepareFieldConfig (field, links) {
    field = field || {};
    links = _.map(links || [], function (link) {
      return link.sys.id;
    });

    var size = findValidation(field, 'size', {});
    var max = (size.max || +Infinity) - links.length;
    var min = (size.min || 1) - links.length;
    min = min < 1 ? 1 : min;

    var config = {
      locale: field.locale,
      multiple: max !== min && field.type === 'Array',
      max: max,
      min: min,
      linksEntry: field.linkType === 'Entry' || field.itemLinkType === 'Entry',
      linksAsset: field.linkType === 'Asset' || field.itemLinkType === 'Asset',
      linkedContentTypeIds: findLinkValidation(field, 'linkContentType'),
      linkedMimetypeGroups: findLinkValidation(field, 'linkMimetypeGroup')

      // @todo see comments in "prepareQueryExtension"
      // linkedFileSize: findValidation(field, 'assetFileSize', {}),
      // linkedImageDimensions: findValidation(field, 'assetImageDimensions', {})
    };

    return _.extend(config, {queryExtension: prepareQueryExtension(config)});
  }

  function prepareExtensionConfig (options) {
    options = options || {};
    var config = _.pick(options, ['locale', 'multiple', 'min', 'max']);

    config = _.extend(config, {
      locale: config.locale || TheLocaleStore.getDefaultLocale().code,
      linksEntry: options.entityType === 'Entry',
      linksAsset: options.entityType === 'Asset',
      linkedContentTypeIds: options.contentTypes || [],
      linkedMimetypeGroups: []
    });

    return _.extend(config, {queryExtension: prepareQueryExtension(config)});
  }

  function findLinkValidation (field, property) {
    var found = findValidation(field, property, []);

    return _.isString(found) ? [found] : found;
  }

  function findValidation (field, property, defaultValue) {
    var validations = [].concat(field.validations || [], field.itemValidations || []);
    var found = _.find(validations, function (v) {
      return _.isObject(v[property]) || _.isString(v[property]);
    });

    return (found && found[property]) || defaultValue;
  }

  function getSingleContentType (config) {
    if (config.linksAsset) {
      return $q.resolve(assetContentType);
    }

    var linked = config.linkedContentTypeIds;
    if (config.linksEntry && linked.length === 1) {
      return spaceContext.publishedCTs.fetch(linked[0]);
    }

    return $q.resolve(null);
  }

  function prepareQueryExtension (config) {
    var extension = {};

    if (config.linksEntry) {
      var ids = config.linkedContentTypeIds;
      if (Array.isArray(ids) && ids.length > 1) {
        extension['sys.contentType.sys.id[in]'] = ids.join(',');
      }
    }

    if (config.linksAsset) {
      var groups = config.linkedMimetypeGroups;
      if (Array.isArray(groups) && groups.length > 0) {
        extension['fields.file.contentType[in]'] = _.reduce(groups, function (cts, group) {
          return cts.concat(mimetype.getTypesForGroup(group));
        }, []).join(',');
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
      (config.linksEntry ? 'entry' : 'asset'),
      (config.multiple ? 'multiple' : 'single')
    ].join('_');

    return LABELS[key];
  }
}]);
