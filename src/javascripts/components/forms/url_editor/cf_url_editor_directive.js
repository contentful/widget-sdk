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
    link: function (scope, $el, _attrs, widgetApi) {
      var field = widgetApi.field;
      var $inputEl = $el.find('input');
      var updateInput = makeInputUpdater($inputEl);

      _.extend(scope, {
        urlStatus: 'ok',
        helpText: widgetApi.settings.helpText
      });

      scope.$watch('urlStatus', function (urlStatus) {
        var isInvalid = urlStatus === 'broken' || urlStatus === 'invalid';
        field.setInvalid(isInvalid);
      });

      var detachOnValueChangedHandler = field.onValueChanged(function (val) {
        // Might be `null` or `undefined` when value is not present
        updateInput(val || '');
      });

      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus);

      var offSchemaErrorsChanged = field.onSchemaErrorsChanged(function (errors) {
        scope.hasErrors = errors && errors.length > 0;
      });

      // remove attached handlers when element is evicted from dom
      scope.$on('$destroy', detachOnValueChangedHandler);
      scope.$on('$destroy', detachOnFieldDisabledHandler);
      scope.$on('$destroy', offSchemaErrorsChanged);

      scope.$watch(function () {
        return $inputEl.val();
      }, function (value) {
        scope.previewUrl = value;
        field.setValue(value);
      });

      $inputEl.on('input change', debounce(scope.$apply.bind(scope), 200));

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };
}]);
