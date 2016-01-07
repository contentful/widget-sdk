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

  function WidgetStore(space) {
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

  WidgetStore.prototype.getMap = function() {
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
    .then(function (widgets) {
      return _.transform(widgets.items, function (byId, data) {
        var widget = buildCustomWidget(data);
        byId[widget.id] = widget;
      }, {});
    }).catch(function (err) {
      logger.logError('Failed to build custom widgets', {
        data: {space: space},
        error: err
      });
      return [];
    });
  }

  function buildCustomWidget (data) {
    var widget = data.widget;
    var fieldTypes = _.map(widget.fieldTypes, fieldFactory.getTypeName);
    return _.extend(_.pick(widget, customWidgetProperties), {
      id: data.sys.id,
      fieldTypes: fieldTypes,
      template: '<cf-iframe-widget>'
    });
  }

  return WidgetStore;

}]);
