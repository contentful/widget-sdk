/**
 * @ngdoc directive
 * @name cfSpaceNavBar
 * @description
 * Displays the top navigation bar for organizations & billing views.
 */
 angular.module('contentful')
.directive('cfOrganizationNav', ['require', function (require) {
  var navBar = require('app/NavBar').default;

  return {
    template: template(),
    restrict: 'E'
  };

  function template () {
    return navBar([
      {
        title: 'Foo',
        sref: '',
        dataViewType: ''
      }
    ]);
  }
}]);
