'use strict';

angular.module('contentful')
.factory('entitySelector', ['require', function (require) {

  var modalDialog = require('modalDialog');
  var spaceContext = require('spaceContext');
  var $q = require('$q');
  var searchQueryHelper = require('searchQueryHelper');
  var mimetype = require('mimetype');

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

  return {open: open};

  function open (field, links) {
    var config = prepareConfig(field, links);

    if (!config.linksEntry && !config.linksAsset) {
      return $q.reject(new Error('Provide a valid field object.'));
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

  function prepareConfig (field, links) {
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
      linkedEntityIds: links,
      linkedContentTypeIds: findValidation(field, 'linkContentType', []),
      linkedMimetypeGroups: findValidation(field, 'linkMimetypeGroup', []),
      linkedFileSize: findValidation(field, 'assetFileSize', {}),
      linkedImageDimensions: findValidation(field, 'assetImageDimensions', {})
    };

    return _.extend(config, {queryExtension: prepareQueryExtension(config)});
  }

  function findValidation (field, property, defaultValue) {
    var validations = [].concat(field.validations || [], field.itemValidations || []);
    var found = _.find(validations, function (v) {
      return _.isObject(v[property]);
    });

    return (found && found[property]) || defaultValue;
  }

  function getSingleContentType (config) {
    if (config.linksAsset) {
      return $q.resolve(searchQueryHelper.assetContentType);
    }

    var linked = config.linkedContentTypeIds;
    if (config.linksEntry && linked.length === 1) {
      return spaceContext.fetchPublishedContentType(linked[0]);
    }

    return $q.resolve(null);
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
