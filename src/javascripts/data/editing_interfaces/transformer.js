'use strict';

angular.module('cf.data')

/**
 * @ngdoc service
 * @module cf.data
 * @name data/editingInterfaces/transformer
 * @description
 * Sanitizes editing interface data and transforms between the API and
 * the internal UI format.
 */
.factory('data/editingInterfaces/transformer', ['$injector', function ($injector) {
  var eiHelpers = $injector.get('editingInterfaces/helpers');
  var logger = $injector.get('logger');
  var migrateWidgetId = $injector.get('widgets/migrations');
  var getDefaultWidgetId = $injector.get('widgets/default');

  return {
    fromAPI: fromAPI,
    toAPI: toAPI,
    makeDefault: makeDefault,
    syncControls: syncControls
  };


  /**
   * @ngdoc method
   * @name data/editingInterfaces/transformer#makeDefault
   * @description
   * Creates default editing interface data for a content type.
   * Specifically it creates links to default widgets for every field.
   *
   * @param {Data.ContentType} contentType
   * @returns {Data.EditingInterface}
   */
  function makeDefault (contentType) {
    var contentTypeLink = {
      sys: {
        id: contentType.sys.id,
        type: 'Link',
        linkType: 'ContentType'
      }
    };

    var ei = {
      sys: {
        contentType: contentTypeLink
      },
      controls: [],
    };

    syncControls(contentType, ei);
    return ei;
  }

  /**
   * @ngdoc method
   * @name data/editingInterfaces/transformer#syncControls
   * @description
   * Mutate the widgets so there is a one-to-one mapping between fields and widgets.
   *
   * Specifically
   * - Controls are ordered according to the fields
   * - Extraneous controls (i.e. those that can not be mapped to a
   *   field) are removed.
   * - If there is no control for a field the default control is added.
   * - Set each controls `field` property to the matching field. Uses
   *   references, so any changes to the content type field will be
   *   reflected in the widget.
   *
   * @param {Data.ContentType} contentType
   * @param {Data.EditingInterface} editingInterface
   */
  function syncControls (contentType, ei) {
    ei.controls = alignControls(contentType, ei.controls);
  }

  /**
   * @pure
   */
  function alignControls (contentType, controls) {
    return _.map(contentType.fields, function (field) {
      var control =
        eiHelpers.findWidget(controls, field) ||
        defaultControl(contentType, field);
      control = _.cloneDeep(control);
      control.field = field;
      return control;
    });
  }

  /**
   * @ngdoc method
   * @name data/editingInterfaces/transformer#fromAPI
   * @description
   * Make sure that we have a order preserving one-to-one
   * correspondance between CT fields and EI widgets.
   *
   * - Remap widgets to use apiNames instead of IDs
   * - Remove extraneous widgets
   * - Add widgets for fields that had no widget before
   * - Put widgets in same order as their corresponding fields
   *
   * @param {API.ContentType} contentType
   * @param {API.EditingInterface} editingInterface
   * @returns {Data.EditingInterface}
   */
  function fromAPI (contentType, ei) {
    var controls;
    if (_.isArray(ei.controls)) {
      controls = ei.controls;
    } else if (_.isArray(ei.widgets)) {
      controls = ei.widgets;
    }
    controls = controlsFromApi(contentType, controls);
    return {
      sys: ei.sys,
      controls: controls
    };
  }

  /**
   * @pure
   * @param {API.ContentType} contentType
   * @param {API.WidgetLink[]} controls
   * @returns {API.WidgetLink[]}
   */
  function controlsFromApi (contentType, controls) {
    var fields = contentType.fields;
    // TODO simplify this
    controls = _.map(controls, migrateApiControl);
    controls = _.map(controls, cleanApiControl);
    controls = migrateWidgetsToApiNames(fields, controls);
    controls = alignControls(contentType, controls);
    controls = _.map(controls, migrateWidgetId);
    return controls;
  }

  function defaultControl (contentType, field) {
    // TODO Content Types should always have an api name. The UI must
    // make sure to set the default if it retrieves one from the
    // server.
    var fieldId = field.apiName || field.id;
    var widgetId = getDefaultWidgetId(field, {data: contentType});
    return {
      fieldId: fieldId,
      field: field,
      widgetId: widgetId,
    };
  }

  /**
   * @ngdoc method
   * @name data/editingInterfaces/transformer#toAPI
   * @description
   * Calls `#syncControls()` on the editing interface and removes
   * extraneous data like empty `settings` and the `field` object
   * from all widgets
   *
   * @param {API.ContentType} contentType
   * @param {Data.EditingInterface} ei
   * @returns {API.EditingInterface}
   */
  function toAPI (contentType, ei) {
    ei = _.cloneDeep(ei);
    syncControls(contentType, ei);
    ei.controls = _.map(ei.controls, cleanApiControl);
    return ei;
  }

  function migrateApiControl (control) {
    if (!_.isObject(control.settings)) {
      control.settings = control.widgetParams;
    }
    return control;
  }

  /**
   * Removes all properties that should not be stored in the API
   */
  function cleanApiControl (control) {
    control = _.pick(control, ['fieldId', 'widgetId', 'settings']);
    if (_.isEmpty(control.settings)) {
      delete control.settings;
    }
    return _.cloneDeep(control);
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
      // Find the field that maps to our widget.
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
      if (widget.fieldId === matchingField.id && matchingField.apiName) {
        newWidget.fieldId = matchingField.apiName;
      }
      migratedWidgets.push(newWidget);
    }, []);
  }
}]);
