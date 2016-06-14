'use strict';

angular.module('contentful')
.directive('cfSingleLineEditor', ['$injector', function ($injector) {
  var makeInputUpdater = $injector.get('ui/caretHelper').makeInputUpdater;
  var debounce = $injector.get('debounce');

  return {
    scope: {},
    require: '^cfWidgetApi',
    restrict: 'E',
    template: JST['cf_single_line_editor'](),
    link: function (scope, $el, _attributes, widgetApi) {
      var field = widgetApi.field;
      var constraints = _(field.validations).map('size').map().first() || {};
      var $inputEl = $el.children('input');
      var updateInput = makeInputUpdater($inputEl);

      if (field.type === 'Symbol' && !_.isNumber(constraints.max)) {
        constraints.max = 256;
      }

      scope.constraints = constraints;
      scope.constraintsType = constraintsType(constraints);

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      });
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateIsDisabledFlag);

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      // update char count whenever input value changes
      scope.$watch(function () {
        return $inputEl.val();
      }, function (val) {
        updateCharCount(val);
        field.setString(val);
      });

      $inputEl.on('input change', debounce(scope.$apply.bind(scope), 200));

      function updateCharCount (val) {
        scope.charCount = (val || '').length;
        if (scope.constraints && scope.constraints.max) {
          scope.charCountStatus = getCharCountStatus(scope.charCount, scope.constraints.max);
        }
      }

      function updateIsDisabledFlag (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };

  function getCharCountStatus (len, maxChars) {
    var charsLeft = maxChars - len;

    if (charsLeft < 0) {
      return 'exceeded';
    } else if (charsLeft > -1 && charsLeft < 10) {
      return 'approaching';
    }
  }

  function constraintsType (constraints) {
    if (_.isNumber(constraints.min) && _.isNumber(constraints.max)) {
      return 'min-max';
    } else if (_.isNumber(constraints.min)) {
      return 'min';
    } else if (_.isNumber(constraints.max)) {
      return 'max';
    } else {
      return '';
    }
  }
}]);
