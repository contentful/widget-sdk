import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'core/utils/kefir';

import entityFieldTemplate from './cf_entity_field.html';

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
    () => {
      return {
        restrict: 'E',
        template: entityFieldTemplate,
        controllerAs: 'fieldController',
        controller: [
          '$scope',
          function ($scope) {
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
                $scope.editorContext.hasInitialFocus && $scope.$first && widget.isFocusable,
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

            const setFieldLocales = () => {
              $scope.fieldLocales = $scope.localeData.isSingleLocaleModeOn
                ? [$scope.localeData.focusedLocale]
                : $scope.activeLocales;
              updateErrorStatus();
            };

            updateActiveLocales();
            setFieldLocales();

            $scope.localeData._proxy.subscribe(({ key }) => {
              if (['focusedLocale', 'isSingleLocaleModeOn'].includes(key)) {
                setFieldLocales();
              }
              if (key === 'activeLocales') {
                updateActiveLocales();
                setFieldLocales();
              }
            });

            // TODO Changes to 'validator.errors' change the behavior of
            // 'validator.hasError()'. We should make this dependency explicity
            // by listening to signal on the validator.
            K.onValueScope($scope, $scope.editorContext.validator.errors$, () => {
              updateActiveLocales();
              setFieldLocales();
            });

            K.onValueScope($scope, $scope.editorContext.focus.field$, (focusedField) => {
              templateData.fieldHasFocus = focusedField === field.id;
            });

            function updateErrorStatus() {
              const { validator } = $scope.editorContext;
              const hasSchemaErrors = $scope.localeData.isSingleLocaleModeOn
                ? validator.hasFieldLocaleError(
                    field.id,
                    $scope.localeData.focusedLocale.internal_code
                  )
                : validator.hasFieldError(field.id);
              const hasControlErrors = _.some(invalidControls);
              $scope.data.fieldHasErrors = hasSchemaErrors || hasControlErrors;
            }

            function updateActiveLocales() {
              const fieldLocalesInternalCodes = getFieldLocales(field).map(
                (locale) => locale.internal_code
              );
              $scope.activeLocales = _.filter($scope.localeData.privateLocales, (locale) => {
                const isFieldLocale = fieldLocalesInternalCodes.includes(locale.internal_code);
                const isActive = $scope.localeData.isLocaleActive(locale);
                const hasError = $scope.editorContext.validator.hasFieldLocaleError(
                  field.id,
                  locale.internal_code
                );
                return hasError || (isFieldLocale && isActive);
              });
            }

            function getFieldLocales(field) {
              if (field.localized) {
                return $scope.localeData.privateLocales;
              } else {
                return [$scope.localeData.defaultLocale];
              }
            }
          },
        ],
      };
    },
  ]);
}
