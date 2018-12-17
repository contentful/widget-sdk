'use strict';

angular
  .module('cf.app')
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
  .directive('cfEntityField', [
    'require',
    require => {
      const _ = require('lodash');
      const RTL_SUPPORT_FEATURE_FLAG = 'feature-at-03-2018-rtl-support';

      const TheLocaleStore = require('TheLocaleStore');
      const K = require('utils/kefir.es6');
      const LD = require('utils/LaunchDarkly');
      const isRtlLocale = require('utils/locales.es6').isRtlLocale;

      return {
        restrict: 'E',
        template: JST.cf_entity_field(),
        controllerAs: 'fieldController',
        controller: [
          '$scope',
          function($scope) {
            // Records the 'invalid' flag for each locale’s control. Keys are public
            // locale codes.
            const invalidControls = {};

            const widget = $scope.widget;
            const field = widget.field;

            // All data that is read by the template
            const templateData = {
              field: field,
              tooltipPlacement: $scope.$first ? 'bottom' : 'top',
              helpText: _.get(widget, ['settings', 'helpText']) || widget.defaultHelpText,
              hasInitialFocus:
                $scope.editorContext.hasInitialFocus && $scope.$first && widget.isFocusable,
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

            $scope.methods = {
              shouldDisplayRtl: _.constant(false)
            };

            LD.onFeatureFlag($scope, RTL_SUPPORT_FEATURE_FLAG, isEnabled => {
              // By default, all entity fields should be displayed as LTR unless the
              // RTL support feature flag is enabled.
              if (isEnabled) {
                $scope.methods.shouldDisplayRtl = isRtlLocale;
              }
            });

            function updateErrorStatus() {
              const hasSchemaErrors = $scope.editorContext.validator.hasFieldError(field.id);
              const hasControlErrors = _.some(invalidControls);
              $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
            }

            function getActiveLocaleCodes() {
              return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
            }

            function updateLocales() {
              $scope.locales = _.filter(getFieldLocales(field), locale => {
                const isActive = TheLocaleStore.isLocaleActive(locale);
                const hasError = $scope.editorContext.validator.hasFieldLocaleError(
                  field.id,
                  locale.internal_code
                );
                return isActive || hasError;
              });
            }

            function getFieldLocales(field) {
              if (field.localized) {
                return TheLocaleStore.getPrivateLocales();
              } else {
                return [TheLocaleStore.getDefaultLocale()];
              }
            }
          }
        ]
      };
    }
  ]);
