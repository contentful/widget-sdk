import { registerDirective, registerController } from 'NgRegistry';
import _ from 'lodash';
import * as K from 'utils/kefir';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfValidate
   *
   * @property {Error[]}  validator.errors
   * @property {boolean}  validator.valid
   *
   * @scope.requires  schema.errors
   * @scope.requires  schema.buildMessage
   */
  registerDirective('cfValidate', () => ({
    restrict: 'A',
    scope: true,
    controller: 'ValidationController',
    controllerAs: 'validator',
  }));

  registerController('ValidationController', [
    '$scope',
    '$attrs',
    '$timeout',
    function ValidationController($scope, $attrs, $timeout) {
      const controller = this;

      // Caches values for #hasError()
      let errorTree = {};

      const errorsBus = K.createPropertyBus([], $scope);

      /**
       * @ngdoc property
       * @name cfValidate#errors$
       * @type {Property<Error[]>}
       */
      controller.errors$ = errorsBus.property;

      controller.errors$.onValue((errors) => {
        controller.errors = errors;
      });

      $scope.validationResult = {};

      $scope.$on('$destroy', (event) => {
        const scope = event.currentScope;
        scope.validationResult = {};
      });

      $scope.$on('validate', () => {
        controller.run();
      });

      /**
       * @ngdoc method
       * @name cfValidate#validator.run
       * @description
       * Validates the data with the schema and updates `validator.errors`
       * and `validator.valid`.
       *
       * If the `path` argument is provided it will rerun the validations
       * but only update errors that matches the path.
       *
       * @param {string|string[]} path
       * @param {bool?} parent  If true, update errors whose path is a
       * child of `path`
       *
       *
       * @returns boolean
       */
      controller.run = function (path, parent) {
        const data = getData();
        const errors = $scope.schema.errors(data);

        if (_.isUndefined(errors)) {
          return this.valid;
        }

        if (path) {
          const matchesPath = errorPathMatcher(path, parent);
          const pathErrors = _.filter(errors, matchesPath);
          const otherErrors = _.reject(this.errors, matchesPath);
          this.setErrors(otherErrors.concat(pathErrors));
        } else {
          this.setErrors(errors);
        }
        return this.valid;
      };
      // TODO deprecated
      $scope.validate = _.bind(controller.run, controller);

      /**
       * @ngdoc method
       * @name cfValidate#validator.runLater
       * @description
       * Behaves like `validator.run()` but runs the validation only after
       * the current digest cycle is completed and in a new digest cycle.
       */
      controller.runLater = (path, parent) => {
        $timeout(() => {
          $scope.$apply(() => {
            controller.run(path, parent);
          });
        });
      };

      /**
       * @ngdoc method
       * @name cfValidate#validator.setErrors
       * @param {Array<Error>} errors
       */
      controller.setErrors = function (errors) {
        $scope.validationResult = makeValidationResult(errors, getData(), $scope.schema);
        errorTree = $scope.validationResult.errorTree;
        errorsBus.set($scope.validationResult.errors);
        this.valid = _.isEmpty(this.errors);
      };

      /**
       * @ngdoc method
       * @name cfValidate#validator.getPathErrors
       * @description
       * Returns only those errors that match the given path.
       *
       * @param {string|string[]} path
       * @param {boolean} parent
       * @returns {Array<Error>}
       */
      controller.getPathErrors = function (path, parent) {
        return _.filter(this.errors, errorPathMatcher(path, parent));
      };

      controller.hasError = (path) => {
        if (Array.isArray(path) && path.length === 0) {
          return !!errorTree;
        } else {
          return !!_.get(errorTree, path);
        }
      };

      function getData() {
        return $scope.$eval($attrs.cfValidate);
      }

      function makeValidationResult(errors, data, schema) {
        errors = _.filter(errors, (error) => {
          if (error && error.path) {
            return error.path[error.path.length - 1] !== '$$hashKey';
          } else {
            return true;
          }
        });

        if (schema.buildMessage) {
          errors = _.forEach(errors, (error) => {
            error.message = schema.buildMessage(error);
          });
        }

        const valid = _.isEmpty(errors);
        return {
          data: data,
          schema: schema,
          errors: errors,
          valid: valid,
          // This is not used currently
          errorTree: makeTree(errors),
        };
      }

      /**
       * Satisfies the following property
       * ~~~
       * var tree = makeTree(items)
       * items.forEach(function (item) {
       *   assertEqual(
       *     valueAt(tree, item.path).$data,
       *     item
       *   )
       * })
       * ~~~
       */
      function makeTree(items) {
        const root = {};
        _.forEach(items, (item) => {
          let node = root;
          const path = normalizePath(item.path);
          _.forEach(path, (segment) => {
            node = node[segment] = node[segment] || {};
          });
          node['$data'] = item;
        });
        return root;
      }

      function errorPathMatcher(path, parent) {
        return (error) => matchesPath(path, error.path, parent);
      }

      function normalizePath(path) {
        if (typeof path === 'undefined' || path === null) {
          return [];
        }
        if (typeof path === 'string') {
          return path ? path.split('.') : [];
        } else if (Array.isArray(path)) {
          return _.map(path, (path) => path.toString());
        } else {
          throw new TypeError('Path is not an array or dot-separated strings');
        }
      }

      function matchesPath(pattern, target, parent) {
        pattern = normalizePath(pattern);
        if (parent === true) {
          pattern.push('*');
        }

        target = normalizePath(target);

        const prefixLen = pattern.length - 1;
        if (pattern[prefixLen] === '*') {
          return _.isEqual(target.slice(0, prefixLen), pattern.slice(0, prefixLen));
        } else {
          return _.isEqual(target, pattern);
        }
      }
    },
  ]);
}
