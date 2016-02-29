'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name editingInterfaces
 */
.factory('editingInterfaces', ['$injector', function($injector){
  var $q             = $injector.get('$q');
  var widgets        = $injector.get('widgets');
  var widgetMigrator = $injector.get('widgets/migrations');
  var logger         = $injector.get('logger');
  var eiHelpers      = $injector.get('editingInterfaces/helpers');

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
        if (err && err.statusCode === 404) {
          return defaultInterface(contentType);
        } else {
          // We should be able to throw the error but $q sucks at this.
          return $q.reject(err);
        }
      })
      .then(_.partial(syncWidgets, contentType))
      .then(addDefaultParams);
    },

    syncWidgets: syncWidgets
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
    var mappedWidgets = migrateWidgetsToApiNames(fields, editingInterface.data.widgets);
    var syncedWidgets = _.map(fields, function (field) {
      return eiHelpers.findWidget(mappedWidgets, field) || defaultWidget(contentType, field);
    });
    var migratedWidgets = _.map(syncedWidgets, widgetMigrator(contentType.data));
    editingInterface.data.widgets = migratedWidgets;
    return editingInterface;
  }

  function addDefaultParams(interf) {
    _.each(interf.data.widgets, function (widget) {
      var defaults = widgets.paramDefaults(widget.widgetId);
      _.defaults(widget.widgetParams, defaults);
    });
    return interf;
  }

  function getEditingInterface (contentType) {
    var version = dotty.get(contentType, 'data.sys.version');
    var revision = dotty.get(contentType, 'data.sys.revision');
    if (version || revision ) {
      return contentType.getEditingInterface('default');
    } else {
      // Content Type has not been persisted yet or is not published, so
      // there exists no editing interface.
      return $q.when(defaultInterface(contentType));
    }
  }

  function defaultInterface (contentType) {
    var data = makeDefaultInterfaceData(contentType);
    return contentType.newEditingInterface(data);
  }

  function makeDefaultInterfaceData (contentType) {
    // TODO We should be able to replace this with a call to 'syncWidgets'.
    var widgets = _.map(contentType.data.fields, _.partial(defaultWidget, contentType));
    return {
      widgets: widgets,
      // TODO It is possible that none of the properties below is needed
      sys: {
        id: 'default',
        type: 'EditingInterface'
      },
      contentTypeId: contentType.getId(),
      title: 'Default',
    };
  }

  // TODO this is not inline with the field factory
  function defaultWidget(contentType, field) {
    var identifier = field.apiName || field.id;
    return {
      fieldId: identifier,
      widgetId: widgets.defaultWidgetId(field, contentType),
      widgetParams: {}
    };
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
      var matchingField = eiHelpers.findField(fields, widget);

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
