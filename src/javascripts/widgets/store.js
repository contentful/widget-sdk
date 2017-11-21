'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/store
 *
 * @usage[js]
 * const Store = require('widgets/store')
 * const store = Store.create(spaceEndpoint)
 * store.getMap()
 * .then((map) => { ... })
 *
 * @description
 * Store custom and builtin widget implementations for the current
 * space.
 *
 * This service gets the latest custom widgets from the server every time.
 */
.factory('widgets/store', ['require', function (require) {
  var builtin = require('widgets/builtin');
  var fieldFactory = require('fieldFactory');

  var extensionProperties = [
    'name', 'src', 'srcdoc', 'sidebar', 'options'
  ];

  return {
    create: create
  };

  function create (spaceEndpoint) {
    if (!spaceEndpoint) {
      throw new TypeError('Space is not set');
    }

    return {
      getMap: getMap
    };

    function getMap () {
      return getExtensions(spaceEndpoint)
      .then(function (widgets) {
        return _.extend({}, builtin, widgets);
      });
    }
  }

  function getExtensions (spaceEndpoint) {
    return spaceEndpoint({
      method: 'GET',
      path: ['extensions']
    }).then(function (response) {
      return createExtensionsMap(response.items);
    }, function () {
      return {};
    });
  }

  /**
   * Takes a list of extensions returned by the server and builds
   * widget descriptors to be used by the entry editor.
   *
   * @param {API.Extension[]} extensions
   * @returns {Map<string, Widget.Descriptor}
   */
  function createExtensionsMap (extension) {
    return _.transform(extension, function (byId, data) {
      var widget = buildExtensionWidget(data);
      byId[widget.id] = widget;
    }, {});
  }

  /**
   * @param {API.Widget} data
   * @returns {Extension.Descriptor}
   */
  function buildExtensionWidget (data) {
    // For backwards compatibility we still look at data.widget. This
    // should be remoed
    var extension = data.extension || data.widget;
    var fieldTypes = _.map(extension.fieldTypes, fieldFactory.getTypeName);
    return _.extend(_.pick(extension, extensionProperties), {
      id: data.sys.id,
      fieldTypes: fieldTypes,
      template: '<cf-iframe-widget>',
      custom: true
    });
  }
}]);
