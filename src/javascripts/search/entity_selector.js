'use strict';

angular.module('contentful')
.factory('entitySelector', ['$injector', function ($injector) {

  var modalDialog = $injector.get('modalDialog');
  var spaceContext = $injector.get('spaceContext');
  var $q = $injector.get('$q');
  var searchQueryHelper = $injector.get('searchQueryHelper');
  var mimetype = $injector.get('mimetype');

  var LABELS = {
    entry_single: {
      title: 'Insert existing entry',
      placeholder: 'Search for an entry',
      info: 'You can insert only one entry. Click on any entry to insert it.'
    },
    entry_multiple: {
      title: 'Insert existing entries',
      placeholder: 'Search for entries',
      button: 'Insert selected entries'
    },
    asset_single: {
      title: 'Insert existing asset',
      placeholder: 'Search for an asset',
      info: 'You can insert only one asset. Click on any asset to insert it.'
    },
    asset_multiple: {
      title: 'Insert existing assets',
      placeholder: 'Search for assets',
      button: 'Insert selected assets'
    }
  };

  return {open: open};

  function open (field, min, max) {
    var config = prepareConfig(field, min, max);

    return getSingleContentType(config)
    .then(function openDialog (singleContentType) {
      return modalDialog.open({
        template: 'entity_selector_dialog',
        ignoreEsc: true,
        noNewScope: true,
        scopeData: {
          config: config,
          labels: getLabels(config),
          singleContentType: singleContentType
        }
      }).promise;
    });
  }

  function prepareConfig (field, min, max) {
    field = field || {};

    var size = findValidation(field, 'size', {});
    var config = {
      multiple: field.type === 'Array',
      linksEntry: field.linkType === 'Entry' || dotty.get(field, 'items.linkType') === 'Entry',
      linksAsset: field.linkType === 'Asset' || dotty.get(field, 'items.linkType') === 'Asset',
      min: _.isNumber(min) ? min : (size.min || 1),
      max: _.isNumber(max) ? max : (size.max || +Infinity),
      linkedContentTypeIds: findValidation(field, 'linkContentType', []),
      linkedMimetypeGroups: findValidation(field, 'linkMimetypeGroup', []),
      linkedFileSize: findValidation(field, 'assetFileSize', {}),
      linkedImageDimensions: findValidation(field, 'assetImageDimensions', {})
    };

    return _.extend(config, {queryExtension: prepareQueryExtension(config)});
  }

  function findValidation (field, property, defaultValue) {
    var validations = [].concat(
      dotty.get(field, 'validations', []),
      dotty.get(field, 'items.validations', [])
    );

    var found = _.find(validations, function (v) {
      return _.isObject(v[property]);
    });

    return (found && found[property]) || defaultValue;
  }

  function getSingleContentType (config) {
    if (config.linksAsset) {
      return $q.resolve(searchQueryHelper.assetContentType);
    }

    if (config.linksEntry) {
      var linked = config.linkedContentTypeIds;
      if (linked.length === 1) {
        return spaceContext.fetchPublishedContentType(linked[0]);
      } else {
        return $q.resolve(null);
      }
    }

    return $q.reject(new Error('Provide a valid field object.'));
  }

  function prepareQueryExtension (config) {
    var extension = {};

    if (config.linksEntry && config.linkedContentTypeIds.length > 1) {
      extension['sys.contentType.sys.id[in]'] = config.linkedContentTypeIds.join(',');
    }

    if (config.linksAsset) {
      var groups = config.linkedMimetypeGroups;
      if (groups.length > 0) {
        extension['fields.file.contentType[in]'] = _.reduce(groups, function (cts, group) {
          return cts.concat(mimetype.getTypesForGroup(group));
        }, []).join(',');
      }

      applySizeConstraint('fields.file.details.size', config.linkedFileSize);
      applySizeConstraint('fields.file.details.width', config.linkedImageDimensions.width);
      applySizeConstraint('fields.file.details.height', config.linkedImageDimensions.height);
    }

    return extension;

    function applySizeConstraint (path, constraint) {
      constraint = _.isObject(constraint) ? constraint : {};
      if (constraint.min) {
        extension[path + '[gte]'] = constraint.min;
      }
      if (constraint.max) {
        extension[path + '[lte]'] = constraint.max;
      }
    }
  }

  function getLabels (config) {
    var key = [
      (config.linksEntry ? 'entry' : 'asset'),
      (config.multiple ? 'multiple' : 'single')
    ].join('_');

    return LABELS[key];
  }
}]);
