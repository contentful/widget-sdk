'use strict';

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
angular.module('contentful')
.directive('cfValidate', [() => ({
  restrict: 'A',
  scope: true,
  controller: 'ValidationController',
  controllerAs: 'validator'
})])

.controller('ValidationController', ['$scope', '$attrs', 'require', function ValidationController ($scope, $attrs, require) {
  var $timeout = require('$timeout');
  var K = require('utils/kefir');
  var controller = this;

  // Caches values for #hasError()
  var errorTree = {};

  var errorsBus = K.createPropertyBus([], $scope);

  /**
   * @ngdoc property
   * @name cfValidate#errors$
   * @type {Property<Error[]>}
   */
  controller.errors$ = errorsBus.property;

  controller.errors$.onValue(errors => {
    controller.errors = errors;
  });

  $scope.validationResult = {};

  $scope.$on('$destroy', event => {
    var scope = event.currentScope;
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
    var data = getData();
    var errors = $scope.schema.errors(data);

    if (_.isUndefined(errors)) {
      return this.valid;
    }

    if (path) {
      var matchesPath = errorPathMatcher(path, parent);
      var pathErrors = _.filter(errors, matchesPath);
      var otherErrors = _.reject(this.errors, matchesPath);
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

  controller.hasError = path => {
    if (Array.isArray(path) && path.length === 0) {
      return !!errorTree;
    } else {
      return !!_.get(errorTree, path);
    }
  };


  function getData () {
    return $scope.$eval($attrs.cfValidate);
  }

  function makeValidationResult (errors, data, schema) {
    errors = _.filter(errors, error => {
      if (error && error.path) {
        return error.path[error.path.length - 1] !== '$$hashKey';
      } else {
        return true;
      }
    });

    if (schema.buildMessage) {
      errors = _.forEach(errors, error => {
        error.message = schema.buildMessage(error);
      });
    }

    var valid = _.isEmpty(errors);
    return {
      data: data,
      schema: schema,
      errors: errors,
      valid: valid,
      // This is not used currently
      errorTree: makeTree(errors)
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
  function makeTree (items) {
    var root = {};
    _.forEach(items, item => {
      var node = root;
      var path = normalizePath(item.path);
      _.forEach(path, segment => {
        node = node[segment] = node[segment] || {};
      });
      node['$data'] = item;
    });
    return root;
  }

  function errorPathMatcher (path, parent) {
    return error => matchesPath(path, error.path, parent);
  }

  function normalizePath (path) {
    if (typeof path === 'undefined' || path === null) {
      return [];
    }
    if (typeof path === 'string') {
      return path ? path.split('.') : [];
    } else if (Array.isArray(path)) {
      return _.map(path, path => path.toString());
    } else {
      throw new TypeError('Path is not an array or dot-separated strings');
    }
  }

  function matchesPath (pattern, target, parent) {
    pattern = normalizePath(pattern);
    if (parent === true) {
      pattern.push('*');
    }

    target = normalizePath(target);

    var prefixLen = pattern.length - 1;
    if (pattern[prefixLen] === '*') {
      return _.isEqual(target.slice(0, prefixLen), pattern.slice(0, prefixLen));
    } else {
      return _.isEqual(target, pattern);
    }
  }
}]);
