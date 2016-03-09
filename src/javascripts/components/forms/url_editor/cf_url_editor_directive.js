'use strict';

angular.module('contentful')
.directive('cfUrlEditor', ['$injector', 'cfUiCaretHelper', function ($injector, cfUiCaretHelper) {
  var getPreservedCaretPosition = cfUiCaretHelper.getPreservedCaretPosition;

  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    scope: {},
    template: JST.cf_url_editor(),
    link: function (scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.children('input.form-control');
      var rawInputEl = $inputEl.get(0);

      _.extend(scope, {
        urlStatus: 'ok',
        url: ''
      });

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(updateInputValue, true);
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus, true);

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);

      // run validations when data in input field is modified
      // and send updated field value over the wire via sharejs
      $inputEl.on('input change', function () {
        var val = $inputEl.val();

        field.setString(val);
        scope.previewUrl = val;
      });

      function updateInputValue (newValue) {
        var currentValue = $inputEl.val();

        if (currentValue === newValue) {
          return;
        }

        var newCaretPosition = getPreservedCaretPosition(rawInputEl.selectionStart, currentValue, newValue);

        $inputEl.val(newValue);
        rawInputEl.selectionStart = rawInputEl.selectionEnd = newCaretPosition;
        scope.previewUrl = newValue;
      }

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
        console.log(scope.isDisabled, 'scope.isDisabled in update disabled status');
      }
    }
  };
}]);
