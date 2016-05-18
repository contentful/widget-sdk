'use strict';

angular.module('contentful')
.directive('cfUrlEditor', ['$injector', function ($injector) {
  var debounce = $injector.get('debounce');
  var makeInputUpdater = $injector.get('ui/caretHelper').makeInputUpdater;

  return {
    restrict: 'E',
    require: '^cfWidgetApi',
    scope: {},
    template: JST.cf_url_editor(),
    link: function (scope, $el, attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.find('input');
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
        field.setString(value);
      });

      $inputEl.on('input change', debounce(scope.$apply.bind(scope), 200));

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };
}]);
