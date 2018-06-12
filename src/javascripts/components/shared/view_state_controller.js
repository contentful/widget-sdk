'use strict';

angular.module('contentful').controller('ViewStateController', ['require', '$scope', 'defaultState', function ViewStateController(require, $scope, defaultState) {
  /**
   * @ngdoc type
   * @name ViewStateController
   *
   * @usage
   *  $scope.viewState = $controller('ViewStateController', {
   *    $scope: $scope,
   *    defaultState: 'loading' // optional
   *  });
   *
   * @description
   * Simple directive to help management of a view with multiple states
   * which do not require separate views or navigation changes
   *
   */

  var state = defaultState;

  /**
   * @ngdoc method
   * @name ViewStateController#set
   *
   * @param {string} name of state to transition to
  */
  this.set = newState => {
    state = newState;
  };

  /**
   * @ngdoc method
   * @name ViewStateController#get
  */
  this.get = () => state;

  /**
   * @ngdoc method
   * @name ViewStateController#is
   * @description
   * Verifies if the expected state is the current state.
   * Useful for use in conjunction with ng-show/ng-if/ng-switch in templates.
   *
   * @param {string} name of state to verify
  */
  this.is = expectedState => state === expectedState;

}]);
