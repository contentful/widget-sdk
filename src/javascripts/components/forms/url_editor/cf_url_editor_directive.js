'use strict';

angular.module('contentful')
.directive('cfUrlEditor', ['$injector', function ($injector) {
  var makeInputUpdater = $injector.get('ui/caretHelper').makeInputUpdater;

  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    scope: {},
    template: JST.cf_url_editor(),
    link: function (scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.children('input.form-control');
      var updateInput = makeInputUpdater($inputEl);

      _.extend(scope, {
        urlStatus: 'ok',
        helpText: widgetApi.settings.helpText
      });

      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      });

      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus);

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);

      scope.$watch(function () {
        return $inputEl.val();
      }, function (value) {
        scope.previewUrl = value;
      });

      // run validations when data in input field is modified
      // and send updated field value over the wire via sharejs
      $inputEl.on('input change', function () {
        field.setString($inputEl.val());
      });

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };
}]);
