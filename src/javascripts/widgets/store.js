'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name widgets/store
 * @description
 * Store custom and builtin widget implementations for the current
 * space.
 *
 * This service caches the widgets of the given space.
 */
.factory('widgets/store', ['$injector', function ($injector) {
  var $q = $injector.get('$q');
  var builtinWidgets = $injector.get('widgets/builtin');
  var logger = $injector.get('logger');
  var fieldFactory = $injector.get('fieldFactory');

  var space;
  var widgetCache;

  var customWidgetProperties = [
    'name', 'src', 'srcdoc', 'sidebar', 'options'
  ];

  return {
    setSpace: setSpace,
    getMap: getMap,
  };

  /**
   * @ngdoc method
   * @name widgets/store#set
   * @param {Client.Space} space
   */
  function setSpace (_space) {
    space = _space;
    widgetCache = null;
  }


  /**
   * @ngdoc method
   * @name widgets/store#getMap
   * @description
   * Returns an object that maps widget ids to widget descriptions.
   *
   * @returns {Map<string, Widget.Descriptor>}
   */
  function getMap () {
    if (!space) {
      return $q.reject(new Error('Space is not set'));
    }

    if (!widgetCache) {
      widgetCache = customWidgets(space)
      .then(function (widgets) {
        return _.extend({}, builtinWidgets, widgets);
      });
    }

    return widgetCache;
  }

  function customWidgets (space) {
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

}]);
