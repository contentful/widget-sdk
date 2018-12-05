'use strict';

angular
  .module('contentful')
  .directive('cfNumberEditor', [
    'require',
    require => {
      const parseNumber = require('cfNumberEditor/parseNumber');
      const InputUpdater = require('ui/inputUpdater');
      const debounce = require('debounce');
      const _ = require('lodash');

      return {
        scope: {},
        restrict: 'E',
        require: '^cfWidgetApi',
        template: JST['cf_number_editor'](),
        link: function(scope, $el, _attrs, widgetApi) {
          const field = widgetApi.field;
          const $inputEl = $el.find('input');
          const updateInput = InputUpdater.create($inputEl.get(0));

          // update input field value when new synced value received via ot magic
          const detachOnValueChangedHandler = field.onValueChanged(val => {
            updateInput(val === 0 ? String(val) : val ? String(val) : '');
          });
          // call handler when the disabled status of the field changes
          const detachOnFieldDisabledHandler = field.onIsDisabledChanged(updateDisabledStatus);

          const offSchemaErrorsChanged = field.onSchemaErrorsChanged(errors => {
            scope.hasErrors = errors && errors.length > 0;
          });

          const range = getRangeFromField(field);

          scope.min = range.min;
          scope.max = range.max;
          scope.step = field.type === 'Integer' ? 1 : 'any';

          // remove attached handlers when element is evicted from dom
          scope.$on('$destroy', detachOnValueChangedHandler);
          scope.$on('$destroy', detachOnFieldDisabledHandler);
          scope.$on('$destroy', offSchemaErrorsChanged);

          scope.$watch(
            () => $inputEl.val(),
            val => {
              const parseResult = parseNumber(val, field.type);

              scope.parseWarning = parseResult.warning;
              field.setInvalid(!parseResult.isValid);
              if (parseResult.isValid) {
                field.setValue(parseResult.value);
              }
            }
          );

          // Since all input handling is done in scope.$watch
          // this is to run the watcher when user interacts
          // with the text input
          $inputEl.on(
            'input change',
            debounce(() => {
              scope.$apply();
            }, 200)
          );

          function updateDisabledStatus(disabledStatus) {
            scope.isDisabled = disabledStatus;
          }
        }
      };

      function getRangeFromField(field) {
        const validation = _.find(field.validations, validation => validation.range);
        return _.get(validation, 'range', {});
      }
    }
  ])
  /**
   * @ngdoc service
   * @name cfNumberEditor/parseNumber
   */
  .factory('cfNumberEditor/parseNumber', [
    'require',
    require => {
      const _ = require('lodash');
      return (value, type) => {
        // This has saner semantics than parseFloat.
        // For values with chars in 'em, it gives
        // us NaN unlike parseFloat
        const floatVal = +value;
        const hasDot = /\./g.test(value);
        const hasFractional = /\.\d+/g.test(value);

        if (_.isEmpty(value)) {
          return {
            isValid: true,
            warning: '',
            value: undefined
          };
        }

        if (isNaN(floatVal)) {
          return {
            isValid: false,
            warning: 'Unrecognized Number',
            value: value
          };
        }

        if (type === 'Integer' && hasDot) {
          const intVal = parseInt(value, 10);

          return {
            isValid: false,
            warning: 'Recognized value: ' + intVal,
            value: intVal
          };
        }

        if (hasDot && !hasFractional) {
          return {
            isValid: false,
            warning: 'Recognized value: ' + floatVal,
            value: floatVal
          };
        }

        return {
          isValid: true,
          warning: '',
          value: floatVal
        };
      };
    }
  ]);
