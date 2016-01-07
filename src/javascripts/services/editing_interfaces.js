'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name editingInterfaces
 */
.factory('editingInterfaces', ['$injector', function($injector){
  var $q             = $injector.get('$q');
  var random         = $injector.get('random');
  var widgets        = $injector.get('widgets');
  var widgetMigrator = $injector.get('widgets/migrations');

  var widgetIdsByContentType = {};

  return {
    /**
     * @ngdoc method
     * @name editingInterfaces#forContentType
     * @description
     * Retrieve an Editing Interface from the API and process it to
     * make it consistent with the CT.
     *
     * If there is no EI for the given CT it creates the default
     * interface by assigning the default widgets to each field.
     *
     * The method also migrates outdated widgets with the
     * `widgets/migrations` service.
     *
     * @param {Client.ContentType} contentType
     * @returns {Promise<Client.EditingInterface>}
     */
    forContentType: function (contentType) {
      return getEditingInterface(contentType)
      .catch(function (err) {
        if(err && err.statusCode === 404) {
          return defaultInterface(contentType);
        } else {
          // We should be able to throw the error but $q sucks at this.
          return $q.reject(err);
        }
      })
      .then(_.partial(syncWidgets, contentType))
      .then(addDefaultParams)
      .then(widgetMigrator(contentType));
    },

    syncWidgets: syncWidgets,
    defaultInterface: defaultInterface,
  };

  /**
   * @ngdoc method
   * @name editingInterfaces#syncWidgets
   * @description
   * Make sure that we have a order preserving one-to-one
   * correspondance between CT fields and EI widgets.
   *
   * - Remove extraneous widgets
   * - Add widgets for fields that had no widget before
   * - Put widgets in same order as their corresponding fields
   *
   * @param {Client.ContentType} contentType
   * @param {Client.EditingInterface} editingInterface
   * @returns {Client.EditingInterface}
   */
  function syncWidgets(contentType, editingInterface) {
    var syncedWidgets = _.map(contentType.data.fields, function (field) {
      return findFieldWidget(field) || defaultWidget(contentType, field);
    });
    editingInterface.data.widgets = syncedWidgets;
    return editingInterface;

    function findFieldWidget (field) {
      return _.find(editingInterface.data.widgets, {fieldId: field.id});
    }
  }

  function addDefaultParams(interf) {
    _.each(interf.data.widgets, function (widget) {
      var defaults = widgets.paramDefaults(widget.widgetId);
      _.defaults(widget.widgetParams, defaults);
    });
    return interf;
  }

  function getEditingInterface(contentType) {
    if (contentType.getId() === 'asset') {
      return $q.when(assetInterface(contentType));
    } else {
      return contentType.getEditingInterface('default');
    }
  }

  function defaultInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditingInterface'
      },
      title: 'Default',
      widgets: []
    };
    var interf = contentType.newEditingInterface(data);
    interf.data.widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));
    return interf;
  }

  function assetInterface(contentType) {
    var data = {
      sys: {
        id: 'default',
        type: 'EditingInterface'
      },
      title: 'Default',
      contentTypeId: contentType.getId(),
      widgets: _.map(contentType.data.fields, _.partial(defaultWidget, contentType))
    };
    return { data: data };
  }

  // TODO this is not inline with the field factory
  function defaultWidget(contentType, field) {
    return {
      id: generateId(field.id, contentType.getId()),
      fieldId: field.id,
      widgetId: widgets.defaultWidgetId(field, contentType),
      widgetParams: {}
    };
  }

  function generateId(fieldId, ctId) {
    if(!widgetIdsByContentType[ctId])
      widgetIdsByContentType[ctId] = {};

    if(!widgetIdsByContentType[ctId][fieldId])
      widgetIdsByContentType[ctId][fieldId] = fieldId + random.id();

    return widgetIdsByContentType[ctId][fieldId];
  }

}]);
