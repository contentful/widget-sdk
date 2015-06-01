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
 * model value changes and stops propagation of the `ngModel:update`
 * and `ngModel:commit` events fired by the `ngModel` controller.
 */
.directive('cfNoForm', [function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      modelCtrl.$setDirty = _.noop;
      scope.$on('ngModel:update', stopThisPropagation);
      scope.$on('ngModel:commit', stopThisPropagation);

      function stopThisPropagation (ev, ngModel) {
        if (ngModel === modelCtrl) {
          ev.stopPropagation();
        }
      }
    }
  };
}])


/**
 * @ngdoc directive
 * @module cf.forms
 * @name ngModel/change
 * @description
 * Emits `ngModel:update` when the view value changes. If the element
 * is an `<input>` tag the `ngModel:commit` is emitted on `blur`.
 * Otherwise the event is emitted imediately after `ngModel:update`.
 *
 * The event data is the model controller.
 */
.directive('ngModel', [function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      listenOnViewChange(emitUpdateEvent);

      var composer;
      if (elem.prop('tagName') === 'INPUT') {
        composer = true;
        elem.on('blur', emitCommitEvent);
      } else {
        composer = false;
        listenOnViewChange(emitCommitEvent);
      }

      function emitCommitEvent () {
        modelCtrl.composing = false;
        scope.$emit('ngModel:commit', modelCtrl);
      }

      function emitUpdateEvent () {
        modelCtrl.composing = true;
        scope.$emit('ngModel:update', modelCtrl);
      }

      function listenOnViewChange (listener) {
        modelCtrl.$viewChangeListeners.push(listener);
      }
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
      if (elem.is('input, textarea')) {
        scope.$watch(function () {
          return modelCtrl.$invalid && !modelCtrl.hideErrors;
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
 * @name ngModel/hideErrors
 * @description
 * Sets the `hideErrors` property to `true` on the model controller if
 * the input has been touched or is dirty.
 */
.directive('ngModel', [function () {
  return {
    require: 'ngModel',
    link: function (scope, elem, attrs, modelCtrl) {
      scope.$watch(function () {
        return modelCtrl.$touched || modelCtrl.$dirty;
      }, function (touched) {
        modelCtrl.hideErrors = !touched;
      });
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
