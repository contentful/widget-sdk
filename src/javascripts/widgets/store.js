'use strict';

angular.module('contentful')

.factory('widgets/store', ['require', function (require) {
  var builtin = require('widgets/builtin');
  var fieldFactory = require('fieldFactory');

  var EXTENSION_PROPS = ['name', 'src', 'srcdoc', 'sidebar'];

  return function create (spaceEndpoint) {
    var cache = [];

    return {
      refresh: function () {
        return getExtensions(spaceEndpoint)
        .then(function (extensions) {
          cache = prepareList(extensions);
          return cache;
        });
      },
      getAll: function () {
        return cache;
      }
    };
  };

  function prepareList (extensions) {
    // Extension and built-in widget IDs may clash :(
    // Extensions used to "override" built-in widgets.
    // It's far from ideal but we retain this behavior for now.
    // TODO figure out what to do?
    var extensionIds = extensions.map(function (e) { return e.id; });
    var filteredBuiltins = builtin.filter(function (b) {
      return !extensionIds.includes(b.id);
    });

    return [].concat(filteredBuiltins).concat(extensions);
  }

  function getExtensions (spaceEndpoint) {
    return spaceEndpoint({
      method: 'GET',
      path: ['extensions']
    }).then(function (res) {
      return res.items.map(buildExtensionWidget);
    }, function () {
      return [];
    });
  }

  function buildExtensionWidget (data) {
    var fieldTypes = _.map(data.extension.fieldTypes, fieldFactory.getTypeName);
    return _.extend(_.pick(data.extension, EXTENSION_PROPS), {
      id: data.sys.id,
      fieldTypes: fieldTypes,
      template: '<cf-iframe-widget>',
      options: [],
      custom: true
    });
  }
}]);
