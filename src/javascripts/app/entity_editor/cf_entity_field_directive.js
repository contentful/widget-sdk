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
.directive('cfEntityField', ['require', require => {
  const INLINE_REFERENCE_FEATURE_FLAG =
    'feature-at-02-2018-inline-reference-field';
  const RTL_SUPPORT_FEATURE_FLAG =
    'feature-at-03-2018-rtl-support';

  const TheLocaleStore = require('TheLocaleStore');
  const $q = require('$q');
  const K = require('utils/kefir');
  const getStore = require('TheStore').getStore;
  const spaceContext = require('spaceContext');
  const EntityHelpers = require('EntityHelpers');
  const LD = require('utils/LaunchDarkly');
  const trackInlineEditorToggle = require('analytics/events/ReferenceEditor').onToggleInlineEditor;
  const getInlineEditingStoreKey = require('app/widgets/link/utils').getInlineEditingStoreKey;
  const isRtlLocale = require('utils/locales').isRtlLocale;

  return {
    restrict: 'E',
    template: JST.cf_entity_field(),
    controllerAs: 'fieldController',
    controller: ['$scope', function ($scope) {
      // Records the 'invalid' flag for each locale’s control. Keys are public
      // locale codes.
      const invalidControls = {};

      const widget = $scope.widget;
      const field = widget.field;
      const store = getStore();

      // All data that is read by the template
      const templateData = {
        field: field,
        tooltipPlacement: $scope.$first ? 'bottom' : 'top',
        helpText: _.get(widget, ['settings', 'helpText']) || widget.defaultHelpText,
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
      this.setInvalid = (localeId, isInvalid) => {
        invalidControls[localeId] = isInvalid;
        updateErrorStatus();
      };

      $scope.$watchCollection(getActiveLocaleCodes, updateLocales);

      // TODO Changes to 'validator.errors' change the behavior of
      // 'validator.hasError()'. We should make this dependency explicity
      // by listening to signal on the validator.
      K.onValueScope($scope, $scope.editorContext.validator.errors$, updateLocales);
      K.onValueScope($scope, $scope.editorContext.validator.errors$, updateErrorStatus);

      K.onValueScope($scope, $scope.editorContext.focus.field$, focusedField => {
        templateData.fieldHasFocus = focusedField === field.id;
      });

      LD.onFeatureFlag($scope, INLINE_REFERENCE_FEATURE_FLAG, isEnabled => {
        $scope.data.canRenderInline = isEnabled && canRenderInline();
      });

      $scope.data.expandedStates = $scope.locales.reduce(
        (expandedStates, locale) => {
          expandedStates[locale.code] = isLocaleFieldExpanded(locale.code);
          return expandedStates;
        },
        {}
      );

      $scope.methods = {
        shouldDisplayRtl: _.constant(false),
        isLocaleFieldExpanded: isLocaleFieldExpanded,
        toggleLocaleFieldExpansion: toggleLocaleFieldExpansion
      };

      LD.onFeatureFlag($scope, RTL_SUPPORT_FEATURE_FLAG, isEnabled => {
        // By default, all entity fields should be displayed as LTR unless the
        // RTL support feature flag is enabled.
        if (isEnabled) {
          $scope.methods.shouldDisplayRtl = isRtlLocale;
        }
      });

      function canRenderInline () {
        return field.type === 'Link' && field.linkType === 'Entry' &&
          $scope.editorContext.createReferenceContext; // i.e., is not nested
      }

      function toggleLocaleFieldExpansion (locale) {
        const localeCode = locale.code;
        const ctExpandedStoreKey = getLocaleFieldExpandedStoreKey(localeCode);
        const newVal = !isLocaleFieldExpanded(localeCode);

        getFieldOrLinkCt(localeCode).then(linkContentType => {
          trackInlineEditorToggle({
            contentType: linkContentType,
            toggleState: newVal,
            selector: field.id + '.' + localeCode
          });
        });

        $scope.data.expandedStates[localeCode] = newVal;
        $scope.$broadcast('ct-expand-state:toggle', [
          field.apiName,
          localeCode,
          newVal
        ]);
        store.set(ctExpandedStoreKey, newVal);
      }

      function isLocaleFieldExpanded (localeCode) {
        const ctExpandedStoreKey = getLocaleFieldExpandedStoreKey(localeCode);
        return $scope.data.canRenderInline && store.get(ctExpandedStoreKey);
      }

      function getLocaleFieldExpandedStoreKey (localeCode) {
        return getInlineEditingStoreKey(
          spaceContext.user.sys.id,
          $scope.editorContext.entityInfo.contentTypeId,
          field.apiName,
          localeCode
        );
      }

      function getFieldOrLinkCt (localeCode) {
        const validIds = EntityHelpers.contentTypeFieldLinkCtIds(field);
        if (validIds.length === 1) {
          return spaceContext.publishedCTs.fetch(validIds[0]);
        }
        const linkedEntry = $scope.fields[field.apiName].getValue(localeCode);
        if (linkedEntry) {
          return spaceContext.space.getEntry(linkedEntry.sys.id).then(entry => {
            const contentTypeId = entry.data.sys.contentType.sys.id;
            return spaceContext.publishedCTs.get(contentTypeId);
          });
        }
        return $q.resolve(null);
      }

      function updateErrorStatus () {
        const hasSchemaErrors = $scope.editorContext.validator.hasFieldError(field.id);
        const hasControlErrors = _.some(invalidControls);
        $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
      }

      function getActiveLocaleCodes () {
        return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
      }

      function updateLocales () {
        $scope.locales = _.filter(getFieldLocales(field), locale => {
          const isActive = TheLocaleStore.isLocaleActive(locale);
          const hasError = $scope.editorContext.validator.hasFieldLocaleError(field.id, locale.internal_code);
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
