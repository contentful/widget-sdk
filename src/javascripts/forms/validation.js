'use strict';

angular.module('cf.forms')

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
.directive('cfValidateForm', ['$interpolate', $interpolate => ({
  restrict: 'A',
  require: ['^cfValidate', 'form'],

  link: function (scope, elem, attrs, ctrls) {
    const validator = ctrls[0];
    const form = ctrls[1];

    const errorPath = $interpolate(attrs.cfValidateForm || attrs.name || '')(scope);

    const validateOn = 'ngModel:' + (scope.$validateOn || 'update');
    scope.$on(validateOn, validate);

    scope.$watchCollection('validator.errors', () => {
      const schemaErrors = validator.getPathErrors(errorPath, true);
      const valid = _.isEmpty(schemaErrors);

      form.errors = schemaErrors;

      // TODO do we realy need this
      form.errorMessages = _.map(schemaErrors, 'message');

      form.$setValidity('schema', valid, 'schema');
    });

    function validate () {
      return validator.runLater(errorPath, true);
    }
  }
})])


/**
 * @ngdoc directive
 * @module cf.forms
 *
 * @name cfValidateModel
 * @usage[jade]
 * div(cf-validate="data")
 *   input(ng-model="data.x" cf-validate-model="x")
 *
 * @description
 * Validates changes in the model with the `cfValidate` directive and
 * adds errors to the model controller.
 *
 * The directive focuses on errors with paths starting with the value
 * of the `cf-validate-model` attribute.
 *
 * When the view value of the model controller changes it will call
 * `validator.run('x', true)`. The directive will also watch changes in
 * `validtor.errors` and add any errors that match the provided path to
 * `ngModelCtrl.$error`.
 *
 * @property {[name: string]: Error} ngModelCtrl.errorDetails
 */
.directive('cfValidateModel', ['$interpolate', $interpolate => ({
  require: ['ngModel', '^cfValidate'],

  link: function (scope, elem, attrs, ctrls) {
    const modelCtrl = ctrls[0];
    const validator = ctrls[1];
    let schemaErrors = [];

    const errorPath = $interpolate(attrs.cfValidateModel || attrs.name || '')(scope);

    const validateOn = 'ngModel:' + (scope.$validateOn || 'update');
    scope.$on(validateOn, validate);

    scope.$watch('validator.errors', () => {
      _.forEach(schemaErrors, error => {
        modelCtrl.$setValidity(error.name, null);
      });

      schemaErrors = validator.getPathErrors(errorPath);

      modelCtrl.errorDetails = mapBy(schemaErrors, 'name');

      _.forEach(schemaErrors, error => {
        modelCtrl.$setValidity(error.name, false);
      });
    });

    function validate () {
      return validator.runLater(errorPath, true);
    }

    function mapBy(collection, iteratee) {
      const grouped = _.groupBy(collection, iteratee);
      return _.mapValues(grouped, items => items[0]);
    }

  }
})])


/**
 * @ngdoc directive
 * @module cf.forms
 * @name cfValidateOn
 * @usage[jade]
 * div(cf-validate="data" cf-validate-on="commit")
 *   input(ng-model="data.field" cf-validate-model)
 * @description
 * Specify the event on `ngModel` directives that triggers validations.
 *
 * Allowed events are `update` and `commit`.
 */
.directive('cfValidateOn', [() => {
  const allowedEvents = ['update', 'commit'];
  return {
    link: function (scope, element, attrs) {
      const eventName = attrs.cfValidateOn;
      if (allowedEvents.indexOf(eventName) === -1)
        throw new Error('Unknown validation event "' + eventName + '"');
      scope.$validateOn = eventName;
    }
  };
}]);
