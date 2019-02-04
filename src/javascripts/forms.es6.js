import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  // Low-level directives for dealing with user input and data bindings

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
  registerDirective('cfNullEmptyInput', () => ({
    restrict: 'A',
    require: 'ngModel',

    link: function(_scope, _elem, _attrs, modelCtrl) {
      modelCtrl.$parsers.push(value => value || null);
    }
  }));

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
  registerDirective('cfNoForm', () => ({
    restrict: 'A',
    require: 'ngModel',

    link: function(scope, _elem, _attrs, modelCtrl) {
      modelCtrl.$setDirty = _.noop;
      scope.$on('ngModel:update', stopThisPropagation);
      scope.$on('ngModel:commit', stopThisPropagation);

      function stopThisPropagation(ev, ngModel) {
        if (ngModel === modelCtrl) {
          ev.stopPropagation();
        }
      }
    }
  }));

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
  registerDirective('ngModel', () => ({
    require: 'ngModel',

    link: function(scope, elem, _attrs, modelCtrl) {
      listenOnViewChange(emitUpdateEvent);

      if (elem.prop('tagName') === 'INPUT') {
        elem.on('blur', emitCommitEvent);
      } else {
        listenOnViewChange(emitCommitEvent);
      }

      function emitCommitEvent() {
        modelCtrl.composing = false;
        scope.$emit('ngModel:commit', modelCtrl);
      }

      function emitUpdateEvent() {
        modelCtrl.composing = true;
        scope.$emit('ngModel:update', modelCtrl);
      }

      function listenOnViewChange(listener) {
        modelCtrl.$viewChangeListeners.push(listener);
      }
    }
  }));

  /**
   * @ngdoc directive
   * @module cf.forms
   * @name ngModel/ariaInavlid
   * @description
   * Sets the `aria-invalid` attribute to the same value as the model
   * controllers `$invalid` property.
   */
  registerDirective('ngModel', () => ({
    require: 'ngModel',

    link: function(scope, elem, attrs, modelCtrl) {
      if (elem.is('input, textarea')) {
        scope.$watch(
          () => modelCtrl.$invalid && !modelCtrl.hideErrors,
          isInvalid => {
            attrs.$set('aria-invalid', isInvalid);
          }
        );
      }
    }
  }));

  /**
   * @ngdoc directive
   * @module cf.forms
   * @name ngModel/hideErrors
   * @description
   * Controls the `hideErrors` property of the model controller.
   *
   * Initially, `hideErrors` is set to true. It will be set to false when
   * one of the following cases occurs.
   *
   * - The view value has been changed. That is `modelCtrl.$dirty` is
   *   set.
   * - The DOM element of the model has a `data-show-errors` attribute.
   * - The form controller has a truthy `showErrors` property.
   */
  registerDirective('ngModel', () => ({
    require: ['ngModel', '?^form'],

    link: function(scope, _elem, attrs, ctrls) {
      const modelCtrl = ctrls[0];
      const formCtrl = ctrls[1];
      modelCtrl.hideErrors = true;
      scope.$watch(
        () => modelCtrl.$dirty || 'showErrors' in attrs || (formCtrl && formCtrl.showErrors),
        show => {
          if (show) {
            modelCtrl.hideErrors = false;
          }
        }
      );
    }
  }));

  /**
   * @ngdoc directive
   * @module cf.forms
   * @name ngForm/scope
   * @description
   * Adds the form controller as the `$form` property to the scope.
   */
  registerDirective('ngForm', [
    '$timeout',
    $timeout => ({
      restrict: 'A',
      require: 'form',
      controller: function() {},

      link: function(scope, _elem, attrs, formCtrl) {
        scope.$form = formCtrl;

        if ('showErrors' in attrs) {
          formCtrl.showErrors = true;
        }

        const removeControl = formCtrl.$removeControl;
        formCtrl.$removeControl = function(ctrl) {
          removeControl.call(this, ctrl);
          $timeout(() => {
            scope.$apply();
          });
        };
      }
    })
  ]);

  /**
   * @ngdoc directive
   * @module cf.forms
   * @name cfFormSubmit
   * @usage[jade]
   * form(cf-on-submit="evaluateMe()")
   *   button(cf-submit-form)
   *
   * @description
   * Calls the `submit()` method on the form controller when clicked.
   */
  registerDirective('cfFormSubmit', () => ({
    restrict: 'A',
    require: '^form',

    link: function(scope, element, attrs, formCtrl) {
      if (!attrs.type) {
        attrs.$set('type', 'submit');
      }

      element.on('click', ev => {
        ev.preventDefault();
        scope.$apply(() => {
          formCtrl.submit();
        });
      });
    }
  }));

  /**
   * @ngdoc directive
   * @module cf.forms
   * @name cfOnSubmit
   * @usage[jade]
   * form(cf-on-submit="evaluateMe()")
   *
   * @description
   * Adds a `submit()` method to the form controller that will evaluate
   * the given expression and set the `showErrors` property to true.
   *
   * For more on the `showErrors` property see the `ngModel/hideErrors`
   * directive.
   */
  registerDirective('cfOnSubmit', () => ({
    restrict: 'A',
    require: 'form',

    link: function(scope, _element, attrs, formCtrl) {
      formCtrl.submit = () => {
        formCtrl.showErrors = true;
        scope.$eval(attrs.cfOnSubmit);
      };
    }
  }));
}
