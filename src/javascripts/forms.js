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
 * @name cfValidateForm
 * @module cf.forms
 *
 * @usage[jade]
 * div(cf-validate="mydata")
 *   div(ng-form cf-validate-form="x")
 *     input(ng-model="mydata.x.y)
 *
 * @description
 * Trigger `scope.validator.run()` when form controls emit the
 * `ngModel:commit` event and adds schema errors to the form.
 *
 * The value of the `cf-validate-form` attribute sets the object path
 * to use in the validator. This means that only errors that are
 * contained in the path are considered by this directive. The
 * directive will also only revalidate this path by passing it as an
 * argument to `validator.run()`.
 *
 * @property {Error[]} formCtrl.errors
 * @property {string[]} formCtrl.errorMessages
 */
.directive('cfValidateForm', ['$interpolate', function ($interpolate) {
  return {
    restrict: 'A',
    require: ['^cfValidate', 'form'],
    link: function (scope, elem, attrs, ctrls) {
      var validator = ctrls[0];
      var form = ctrls[1];

      var errorPath = $interpolate(attrs.cfValidateForm || attrs.name || '')(scope);

      scope.$on('ngModel:commit', validate);

      scope.$watchCollection('validator.errors', function () {
        var schemaErrors = validator.getPathErrors(errorPath, true);
        var valid = _.isEmpty(schemaErrors);

        form.errors = schemaErrors;

        // TODO do we realy need this
        form.errorMessages = _.map(schemaErrors, 'message');

        form.$setValidity('schema', valid, 'schema');
      });

      function validate () {
        return validator.run(errorPath, true);
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
