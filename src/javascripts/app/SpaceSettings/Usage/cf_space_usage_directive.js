'use strict';

angular.module('contentful').directive('cfSpaceUsage', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const SpaceUsage = require('app/SpaceSettings/Usage/SpaceUsage.es6').default;
    const spaceContext = require('spaceContext');

    return {
      link: function($scope, el) {
        const host = el[0];

        ReactDOM.render(
          <SpaceUsage spaceId={spaceContext.getId()} orgId={spaceContext.organization.sys.id} />,
          host
        );

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(host);
        });
      }
    };
  }
]);
