'use strict';

angular.module('contentful')

.factory('widgets/store', ['require', (require) => {
  var createBuiltinWidgetsList = require('widgets/builtin').create;
  var fieldFactory = require('fieldFactory');

  return function create (cma) {
    var cache = [];

    return {
      refresh: refresh,
      getAll: function () { return cache; }
    };

    function refresh () {
      return cma.getExtensions()
      .then(res => res.items.map(buildExtensionWidget), () => [])
      .then(extensions => {
        cache = prepareList(extensions);
        return cache;
      });
    }
  };

  function prepareList (extensions) {
    // Extension and built-in widget IDs may clash :(
    // Extensions used to "override" built-in widgets.
    // It's far from ideal but we retain this behavior for now.
    // TODO figure out what to do?
    var extensionIds = extensions.map(e => e.id);
    var builtin = createBuiltinWidgetsList();
    var filteredBuiltins = builtin.filter(b => {
      return !extensionIds.includes(b.id);
    });

    return [].concat(filteredBuiltins).concat(extensions);
  }

  function buildExtensionWidget (data) {
    var src = data.extension.src;
    var base = src ? {src: src} : {srcdoc: data.extension.srcdoc};

    return Object.assign(base, {
      id: data.sys.id,
      name: data.extension.name,
      fieldTypes: data.extension.fieldTypes.map(fieldFactory.getTypeName),
      sidebar: data.extension.sidebar,
      template: '<cf-iframe-widget />',
      parameters: _.get(data.extension, ['parameters', 'instance']) || [],
      installationParameters: {
        definitions: _.get(data.extension, ['parameters', 'installation']) || [],
        values: data.parameters || {}
      },
      custom: true
    });
  }
}]);
