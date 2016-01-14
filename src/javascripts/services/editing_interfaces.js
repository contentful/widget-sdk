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
  var logger         = $injector.get('logger');

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
      // This is triggered when a CT has been created via the API, but has no EI
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
    findField: findField,
    findWidget: findWidget
  };

  /**
   * @ngdoc method
   * @name editingInterfaces#syncWidgets
   * @description
   * Make sure that we have a order preserving one-to-one
   * correspondance between CT fields and EI widgets.
   *
   * - Remap widgets to use apiNames instead of IDs
   * - Remove extraneous widgets
   * - Add widgets for fields that had no widget before
   * - Put widgets in same order as their corresponding fields
   *
   * @param {Client.ContentType} contentType
   * @param {Client.EditingInterface} editingInterface
   * @returns {Client.EditingInterface}
   */
  function syncWidgets(contentType, editingInterface) {
    var fields = contentType.data.fields;
    var migratedWidgets = migrateWidgetsToApiNames(fields, editingInterface.data.widgets);
    var syncedWidgets = _.map(fields, function (field) {
      return findWidget(migratedWidgets, field) || defaultWidget(contentType, field);
    });
    editingInterface.data.widgets = syncedWidgets;
    return editingInterface;
  }

  /**
   * @ngdoc method
   * @description
   * Find a field in a content types fields based on the passed in `widget`'s
   * fieldId.  Since we can't be sure that all content types have the `apiName`
   * property in the field, we need to fall back to the `id`.
   *
   * @param {Array<API.Field>} contentTypeFields
   * @param {API.Widget} widget
   * @return {API.Field?}
   */
  function findField(contentTypeFields, widget) {
    // Both widget.fieldId and field.apiName could be undefined due to legacy
    // data. For this reason a comparison between a fieldId that is undefined
    // and a apiName that is undefined would result in true, causing mismatched
    // mapping and a subtle bug.
    if(!_.isString(widget.fieldId)) {
      return;
    }
    return _.find(contentTypeFields, function(field) {
      return field.apiName === widget.fieldId || field.id === widget.fieldId;
    });
  }

  /**
   * @ngdoc method
   * Find a widget in an array of widget mappings that is related to a fields
   * apiName or id.  Primarily we want to map via apiNames, but if a field does
   * not have an apiName we need to fall back to the id.
   *
   * @param {Array<API.Widget>} widgets
   * @param {API.Field} contentTypeField
   * @return {API.Widget?}
   */
  function findWidget(widgets, contentTypeField) {
    return _.find(widgets, function(widget) {
      // Both widget.fieldId and field.apiName could be undefined due to legacy
      // data. For this reason a comparison between a fieldId that is undefined
      // and a apiName that is undefined would result in true, causing
      // mismatched mapping and a subtle bug.
      if(!_.isString(widget.fieldId)) {
        return;
      }
      return widget.fieldId === contentTypeField.apiName || widget.fieldId === contentTypeField.id;
    });
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
    // TODO We should be able to replace this with a call to 'syncWidgets'.
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
    var identifier = field.apiName || field.id;
    return {
      id: generateId(identifier, contentType.getId()),
      fieldId: identifier,
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

  // This function only serves migration purposes. It remaps old editing
  // interfaces so that they use external id's (apiNames)) instead of internal
  // ones (ids).  See user story at:
  // https://contentful.tpondemand.com/entity/7098
  // This function attempts to migrate editing interface widgets using a 'best
  // case' scenario.  For each widget it tries to find the corresponding content
  // type field. If a mapping does not exist or is corrupt it removes it.
  function migrateWidgetsToApiNames (fields, widgets) {
    return _.transform(widgets, function (migratedWidgets, widget) {
      // Find the field(s) that map to our widget.
      var matchingField = findField(fields, widget);

      // If the editor interface has no mapping, ignore it.
      if (!matchingField) {
        // Metadata used for logging in case we hit an error
        var errMetaData = {
          data: {
            widget: widget,
            contentTypeFields: fields
          }
        };
        var errMsg = 'The widget has no mapping to a content type field.';
        logger.logWarn(errMsg, errMetaData);
        return;
      }

      var newWidget = _.cloneDeep(widget);
      if (widget.fieldId === matchingField.id && _.isString(matchingField.apiName)) {
        newWidget.fieldId = matchingField.apiName;
      }
      migratedWidgets.push(newWidget);
    }, []);
  }

}]);

