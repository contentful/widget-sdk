import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';

/**
 * @ngdoc service
 * @module cf.data
 * @name data/editingInterfaces/transformer
 * @description
 * Sanitizes editing interface data and transforms between the API and
 * the internal UI format.
 */
registerFactory('data/editingInterfaces/transformer', [
  'editingInterfaces/helpers',
  'widgets/migrations',
  'widgets/default',
  (eiHelpers, migrateWidgetId, getDefaultWidgetId) => {
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
    function makeDefault(contentType) {
      const contentTypeLink = {
        sys: {
          id: contentType.sys.id,
          type: 'Link',
          linkType: 'ContentType'
        }
      };

      const ei = {
        sys: {
          contentType: contentTypeLink,
          version: 0
        },
        controls: []
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
    function syncControls(contentType, ei) {
      ei.controls = alignControls(contentType, ei.controls);
    }

    /**
     * @pure
     */
    function alignControls(contentType, controls) {
      return _.map(contentType.fields, field => {
        let control = eiHelpers.findWidget(controls, field) || defaultControl(contentType, field);
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
    function fromAPI(contentType, ei) {
      const controls = controlsFromApi(contentType, ei.controls);
      return {
        sys: ei.sys,
        controls: controls
      };
    }

    /**
     * @param {API.ContentType} contentType
     * @param {API.WidgetLink[]} controls
     * @returns {Data.FieldControl[]}
     */
    function controlsFromApi(contentType, controls) {
      return alignControls(contentType, controls).map(migrateWidgetId);
    }

    function defaultControl(contentType, field) {
      // TODO Content Types should always have an api name. The UI must
      // make sure to set the default if it retrieves one from the
      // server.
      const fieldId = field.apiName || field.id;
      const widgetId = getDefaultWidgetId(field, contentType.displayField);
      return {
        fieldId: fieldId,
        field: field,
        widgetId: widgetId
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
    function toAPI(contentType, ei) {
      ei = _.cloneDeep(ei);
      syncControls(contentType, ei);
      ei.controls = _.map(ei.controls, cleanApiControl);
      return ei;
    }

    /**
     * Removes all properties that should not be stored in the API
     */
    function cleanApiControl(control) {
      control = _.pick(control, ['fieldId', 'widgetId', 'settings']);
      if (_.isEmpty(control.settings)) {
        delete control.settings;
      }
      return _.cloneDeep(control);
    }
  }
]);
