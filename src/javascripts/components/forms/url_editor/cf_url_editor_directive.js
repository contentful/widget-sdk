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

      _.extend(scope, {
        urlStatus: 'ok'
      });

      // update input field value when new synced value received via ot magic
      var detachOnValueChangedHandler = field.onValueChanged(makeInputUpdater($inputEl), true);
      // call handler when the disabled status of the field changes
      var detachOnFieldDisabledHandler = field.onDisabledStatusChanged(updateDisabledStatus, true);

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
        var val = $inputEl.val();

        field.setString(val);
      });

      function updateDisabledStatus (disabledStatus) {
        scope.isDisabled = disabledStatus;
      }
    }
  };
}]);
