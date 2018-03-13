'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfEntityField
 *
 * @property {API.Locale[]} $scope.locales
 * @property {object}       $scope.data
 *   Data that is read by the template
 * @property {API.Field}    $scope.data.field
 * @property {string}       $scope.data.helpText
 * @property {boolean}      $scope.data.showHelpText
 * @property {boolean}      $scope.data.hasInitialFocus
 * @property {boolean}      $scope.data.fieldHasFocus
 * @property {boolean}      $scope.data.fieldHasErrors
 *
 * @scope.requires {object} widget
 * Has field data and specifications to render the control. Provided by
 * `FromWidgetsController`.
 * @scope.requires {FieldControls/Focus} focus
 *
 * @scope.requires {entityEditor/Context} editorContext
 */
.directive('cfEntityField', ['require', function (require) {
  var INLINE_REFERENCE_FEATURE_FLAG =
    'feature-at-02-2018-inline-reference-field';

  var TheLocaleStore = require('TheLocaleStore');
  var $q = require('$q');
  var K = require('utils/kefir');
  var getStore = require('TheStore').getStore;
  var spaceContext = require('spaceContext');
  var EntityHelpers = require('EntityHelpers');
  var LD = require('utils/LaunchDarkly');
  var trackInlineEditorToggle = require('analytics/events/ReferenceEditor').onToggleInlineEditor;

  return {
    restrict: 'E',
    template: JST.cf_entity_field(),
    controllerAs: 'fieldController',
    controller: ['$scope', function ($scope) {
      // Records the 'invalid' flag for each locale’s control. Keys are public
      // locale codes.
      var invalidControls = {};

      var widget = $scope.widget;
      var field = widget.field;
      var store = getStore();

      // All data that is read by the template
      var templateData = {
        field: field,
        tooltipPlacement: $scope.$first ? 'bottom' : 'top',
        helpText: widget.settings.helpText || widget.defaultHelpText,
        hasInitialFocus: $scope.editorContext.hasInitialFocus &&
          $scope.$first &&
          widget.isFocusable,
        showHelpText: !widget.rendersHelpText
      };
      $scope.data = templateData;

      /**
       * @ngdoc method
       * @name cfEntityField#fieldController.setInvalid
       * @description
       *
       * @param {string} localeId Public locale code
       * @param {boolean} isInvalid
       */
      this.setInvalid = function (localeId, isInvalid) {
        invalidControls[localeId] = isInvalid;
        updateErrorStatus();
      };

      $scope.$watchCollection(getActiveLocaleCodes, updateLocales);

      // TODO Changes to 'validator.errors' change the behavior of
      // 'validator.hasError()'. We should make this dependency explicity
      // by listening to signal on the validator.
      K.onValueScope($scope, $scope.editorContext.validator.errors$, updateLocales);
      K.onValueScope($scope, $scope.editorContext.validator.errors$, updateErrorStatus);

      K.onValueScope($scope, $scope.editorContext.focus.field$, function (focusedField) {
        templateData.fieldHasFocus = focusedField === field.id;
      });

      LD.onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, function (isEnabled) {
        $scope.data.canRenderInline = isEnabled && canRenderInline();
      });

      $scope.data.expandedStates = $scope.locales.reduce(
        function (expandedStates, locale) {
          expandedStates[locale.code] = isLocaleFieldExpanded(locale);
          return expandedStates;
        },
        {}
      );
      $scope.methods = {
        isLocaleFieldExpanded: isLocaleFieldExpanded,
        toggleLocaleFieldExpansion: toggleLocaleFieldExpansion
      };

      function canRenderInline () {
        return field.type === 'Link' && field.linkType === 'Entry' &&
          $scope.editorContext.createReferenceContext; // i.e., is not nested
      }

      function toggleLocaleFieldExpansion (locale) {
        var ctExpandedStoreKey = getCTExpandedStoreKey(locale);
        var newVal = !isLocaleFieldExpanded(locale);
        var localeCode = locale.code;

        getFieldOrLinkCt(localeCode).then(function (linkContentType) {
          trackInlineEditorToggle({
            contentType: linkContentType,
            toggleState: newVal
          });
        });

        $scope.data.expandedStates[localeCode] = newVal;
        $scope.$broadcast('ct-expand-state:toggle', [
          field.name,
          localeCode,
          newVal
        ]);
        store.set(ctExpandedStoreKey, newVal);
      }

      function isLocaleFieldExpanded (locale) {
        var ctExpandedStoreKey = getCTExpandedStoreKey(locale);
        return $scope.data.canRenderInline && store.get(ctExpandedStoreKey);
      }

      function getCTExpandedStoreKey (locale) {
        return [
          spaceContext.user.sys.id,
          $scope.editorContext.entityInfo.contentTypeId,
          field.name, // Should actually be field.id
          locale.code
        ].join(':');
      }

      function getFieldOrLinkCt (localeCode) {
        var validIds = EntityHelpers.contentTypeFieldLinkCtIds(field);
        if (validIds.length === 1) {
          return spaceContext.publishedCTs.fetch(validIds[0]);
        }
        var linkedEntry = $scope.fields[field.apiName].getValue(localeCode);
        if (linkedEntry) {
          return spaceContext.space.getEntry(linkedEntry.sys.id).then(function (entry) {
            var contentTypeId = entry.data.sys.contentType.sys.id;
            return spaceContext.publishedCTs.get(contentTypeId);
          });
        }
        return $q.resolve(null);
      }

      function updateErrorStatus () {
        var hasSchemaErrors = $scope.editorContext.validator.hasFieldError(field.id);
        var hasControlErrors = _.some(invalidControls);
        $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
      }

      function getActiveLocaleCodes () {
        return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
      }

      function updateLocales () {
        $scope.locales = _.filter(getFieldLocales(field), function (locale) {
          var isActive = TheLocaleStore.isLocaleActive(locale);
          var hasError = $scope.editorContext.validator.hasFieldLocaleError(field.id, locale.internal_code);
          return isActive || hasError;
        });
      }

      function getFieldLocales (field) {
        if (field.localized) {
          return TheLocaleStore.getPrivateLocales();
        } else {
          return [TheLocaleStore.getDefaultLocale()];
        }
      }
    }]
  };
}]);
