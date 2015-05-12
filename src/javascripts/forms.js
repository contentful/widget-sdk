'use strict';


/**
 * @ngdoc module
 * @name cf.forms
 * @description
 * Low-level directives for dealing with user input and data bindings
 */
angular.module('cf.forms', [])

/**
 * @ngdoc directive
 * @name cfNullEmptyInput
 * @module cf.forms
 * @usage[html]
 * <input ng-model="myvalue" cf-null-empty-input>
 *
 * @description
 * Set the model value to `null` if the input is the empty string
 */
.directive('cfNullEmptyInput', [function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      modelCtrl.$parsers.push(function (value) {
        if (!value)
          return null;
        else
          return value;
      });
    }
  };
}])

/**
 * @ngdoc directive
 * @module cf.forms
 * @name cfNoForm
 * @usage[jade]
 * form(name="myform")
 *   input(ng-model="myvalue" cf-no-form)
 *
 * @description
 * Prevent setting the `$dirty` property on `myform` to true when the
 * model value changes
 */
.directive('cfNoForm', [function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      modelCtrl.$setDirty = _.noop;
    }
  };
}])


/**
 * @ngdoc directive
 * @module cf.forms
 * @name ngModel/change
 * @description
 * Emits the `ngModelChange` event on the scope when the model value
 * is changed.
 */
.directive('ngModel', [function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      modelCtrl.$viewChangeListeners.push(function () {
        scope.$emit('ngModelChange', {
          value: modelCtrl.$modelValue,
          ngModel: modelCtrl
        });
      });
    }
  };
}])


/**
 * @ngdoc directive
 * @module cf.forms
 * @name ngModel/ariaInavlid
 * @description
 * Sets the `aria-invalid` attribute to the same value as the model
 * controllers `$invalid` property.
 */
.directive('ngModel', [function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      if (elem.is('input')) {
        scope.$watch(function () {
          return modelCtrl.$invalid;
        }, function (isInvalid) {
          attrs.$set('aria-invalid', isInvalid);
        });
      }
    }
  };
}])


/**
 * @ngdoc directive
 * @module cf.forms
 * @name ngForm/scope
 * @description
 * Adds the form controller as the `$form` property to the scope.
 */
.directive('ngForm', ['$timeout', function ($timeout) {
  return {
    restrict: 'A',
    require: 'form',
    controller: function () {},
    link: function (scope, elem, attrs, formCtrl) {
      scope.$form = formCtrl;

      var removeControl = formCtrl.$removeControl;
      formCtrl.$removeControl = function (ctrl) {
        removeControl.call(this, ctrl);
        $timeout(function () {
          scope.$apply();
        });
      };
    }
  };
}]);
