import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { RTL_SUPPORT_FEATURE_FLAG } from 'featureFlags.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfEntityField
   *
   * @property {API.Locale[]} $scope.activeLocales
   * @property {object}       $scope.data
   *   Data that is read by the template
   * @property {API.Field}    $scope.data.field
   * @property {string}       $scope.data.helpText
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
  registerDirective('cfEntityField', [
    'TheLocaleStore',
    'utils/LaunchDarkly/index.es6',
    'utils/locales.es6',
    (TheLocaleStore, LD, localesUtils) => {
      const { isRtlLocale } = localesUtils;

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
              helpText: _.get(widget, ['settings', 'helpText']),
              hasInitialFocus:
                $scope.editorContext.hasInitialFocus && $scope.$first && widget.isFocusable
            };
            $scope.data = templateData;

            const setLocales = () => {
              $scope.fieldLocales = $scope.isLocaleFocused
                ? [$scope.focusedLocale]
                : $scope.activeLocales;
              updateErrorStatus();
            };
            $scope.$watch('isLocaleFocused', setLocales);
            $scope.$watch('focusedLocale', setLocales);
            setLocales();

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
              const { validator } = $scope.editorContext;
              const hasSchemaErrors = $scope.isLocaleFocused
                ? validator.hasFieldLocaleError(field.id, $scope.focusedLocale.internal_code)
                : validator.hasFieldError(field.id);
              const hasControlErrors = _.some(invalidControls);
              $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
            }

            function getActiveLocaleCodes() {
              return _.map(TheLocaleStore.getActiveLocales(), 'internal_code');
            }

            function updateLocales() {
              const fieldLocalesInternalCodes = getFieldLocales(field).map(
                locale => locale.internal_code
              );
              $scope.activeLocales = _.filter(TheLocaleStore.getPrivateLocales(), locale => {
                const isFieldLocale = fieldLocalesInternalCodes.includes(locale.internal_code);
                const isActive = TheLocaleStore.isLocaleActive(locale);
                const hasError = $scope.editorContext.validator.hasFieldLocaleError(
                  field.id,
                  locale.internal_code
                );
                return hasError || (isFieldLocale && isActive);
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
}
