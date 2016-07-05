'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/store
 *
 * @usage
 *  ws = new WidgetStore();
 *
 * @description
 * Store custom and builtin widget implementations for the current
 * space.
 *
 * This service gets the latest custom widgets from the server every time.
 */
.factory('widgets/store', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var builtinWidgets = $injector.get('widgets/builtin');
  var logger = $injector.get('logger');
  var fieldFactory = $injector.get('fieldFactory');


  var customWidgetProperties = [
    'name', 'src', 'srcdoc', 'sidebar', 'options'
  ];

  function WidgetStore (space) {
    this.space = space;
  }

  /**
   * @ngdoc method
   * @name widgets/store#getMap
   *
   * @usage
   *  ws.getMap().then(function(widgets) {
   *    console.log(widgets);
   *  });
   *
   * @description
   * Returns a a promise resolving to an object that maps widget ids to
   * widget descriptions.
   *
   * @returns {Promise<object>}
   */

  WidgetStore.prototype.getMap = function () {
    if (!this.space) {
      return $q.reject(new Error('Space is not set'));
    }

    return getCustomWidgets(this.space)
    .then(function (widgets) {
      return _.extend({}, builtinWidgets, widgets);
    });
  };

  function getCustomWidgets (space) {
    return space.endpoint('widgets').get()
    .then(function (response) {
      return createCustomWidgetMap(response.items);
    }, function () {
      return {};
    });
  }

  /**
   * Takes a list of Widgets returned by the server and builds widget
   * descriptors to be used by the entry editor.
   *
   * @param {API.Widget[]} widgets
   * @returns {Map<string, Widget.Descriptor}
   */
  function createCustomWidgetMap (widgets) {
    return _.transform(widgets, function (byId, data) {
      try {
        var widget = buildCustomWidget(data);
        byId[widget.id] = widget;
      } catch (err) {
        logger.logError('Failed to build custom widgets', {
          data: {widget: data},
          error: err
        });
      }
    }, {});
  }

  /**
   * @param {API.Widget} data
   * @returns {Widget.Descriptor}
   */
  function buildCustomWidget (data) {
    var widget = data.widget;
    var fieldTypes = _.map(widget.fieldTypes, fieldFactory.getTypeName);
    return _.extend(_.pick(widget, customWidgetProperties), {
      id: data.sys.id,
      fieldTypes: fieldTypes,
      template: '<cf-iframe-widget>',
      custom: true
    });
  }

  return WidgetStore;

}]);
