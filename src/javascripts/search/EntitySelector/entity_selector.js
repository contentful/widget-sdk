'use strict';

/**
 * @ngdoc service
 * @name entitySelector
 * @description
 * Opens a modal window for entity selection.
 */
angular.module('contentful').factory('entitySelector', [
  'require',
  require => {
    const _ = require('lodash');
    const modalDialog = require('modalDialog');
    const $q = require('$q');
    const {
      getLabels,
      newConfigFromField,
      newConfigFromExtension,
      calculateIdealListHeight
    } = require('search/EntitySelector/Config.es6');

    return {
      openFromField,
      openFromExtension,
      open
    };

    /**
     * @ngdoc method
     * @name entitySelector#open
     * @param {Object} options
     * {
     *   locale: {String},
     *   multiple: {Boolean},
     *   max: {Number?}, // for multiple=true
     *   min: {Number?}, // for multiple=true
     *   entityType: {String},
     *   linkedContentTypeIds: {Array?},
     *   linkedMimetypeGroups: {Array?},
     *   fetch: {function(params): Promise<{items: {Array}, total: {Number}}>},
     *   labels: {
     *     title: {String},
     *     input: {String},
     *     info: {String?}, // for multiple=false
     *     infoHtml: {String?}, // for multiple=false, can be used instead of `.info`
     *     selected: {String}, // for multiple=true
     *     empty: {String},
     *     noEntitiesCustomHtml: {String?} // custom html for the whole dialog when there are no entities
     *     insert: {String},
     *     searchPlaceholder: {String}
     *   }
     * }
     * @returns {Promise<API.Entity[]>}
     * @description
     * Opens a modal for the provided custom config object
     */
    function open(options) {
      const config = _.omit(options, 'scope', 'labels');
      const labels = _.extend(getLabels(options), options.labels);
      const entitySelectorProps = {
        config,
        labels,
        listHeight: calculateIdealListHeight(350),
        onChange,
        onNoEntities
      };
      const scopeData = {
        entitySelector: entitySelectorProps,
        selected: [],
        showCustomEmptyMessage: false
      };
      const dialog = modalDialog.open({
        template: 'entity_selector_dialog',
        backgroundClose: true,
        ignoreEsc: true,
        noNewScope: true,
        scopeData
      });
      return dialog.promise;

      function onChange(entities) {
        if (!config.multiple) {
          dialog.confirm(entities);
        } else {
          dialog.scope.selected = entities;
        }
      }
      function onNoEntities() {
        if (labels.noEntitiesCustomHtml) {
          dialog.scope.showCustomEmptyMessage = true;
          // hacky way to recenter the modal once it's resized
          setTimeout(_ => dialog._centerOnBackground(), 0);
        }
      }
    }

    /**
     * @ngdoc method
     * @name entitySelector#openFromField
     * @param {API.Field} field
     * @param {number?} currentSize
     *   Current number of entities on the field. Used to calculate the
     *   number of entities that can be selected if there are size
     *   validations. Defaults to zero.
     * @returns {Promise<API.Entity[]>}
     * @description
     * Opens a modal for the provided reference
     * field and optional list of existing links.
     */
    function openFromField(field, currentSize) {
      return newConfigFromField(field, currentSize || 0).then(open);
    }

    /**
     * @ngdoc method
     * @name entitySelector#openFromExtension
     * @param {string}   options.locale        Locale code to show entity description
     * @param {string}   options.entityType    "Entry" or "Asset"
     * @param {boolean}  options.multiple      Flag for turning on/off multiselection
     * @param {number}   options.min           Minimal number of selected entities
     * @param {number}   options.max           Maximal number of selected entities
     * @param {string[]} options.contentTypes  List of CT IDs to filter entries with
     * @returns {Promise<API.Entity[]>}
     * @description
     * Opens a modal for a configuration object
     * coming from the extension SDK "dialogs"
     * namespace.
     */
    function openFromExtension(options) {
      return newConfigFromExtension(options)
        .then(open)
        .then(
          (
            selected // resolve with a single object if selecting only
          ) =>
            // one entity, resolve with an array otherwise
            options.multiple ? selected : selected[0],
          (
            err // resolve with `null` if a user skipped selection,
          ) =>
            // reject with an error otherwise
            err ? $q.reject(err) : null
        );
    }
  }
]);
