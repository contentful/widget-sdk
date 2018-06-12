'use strict';

angular.module('contentful')
.directive('cfSpaceUsage', ['require', require => {
  var React = require('react');
  var ReactDOM = require('react-dom');
  var SpaceUsage = require('app/SpaceSettings/Usage/SpaceUsage').default;
  var spaceContext = require('spaceContext');

  return {
    link: function ($scope, el) {
      var host = el[0];

      ReactDOM.render(React.createElement(SpaceUsage, {
        spaceId: spaceContext.getId(),
        orgId: spaceContext.organizationContext.organization.sys.id
      }), host);

      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(host);
      });
    }
  };
}]);
