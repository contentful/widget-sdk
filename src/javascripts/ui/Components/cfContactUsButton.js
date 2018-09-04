'use strict';

angular.module('contentful').directive('cfContactUsButton', [
  'require',
  require => {
    var React = require('react');
    var ReactDOM = require('react-dom');
    var ContactUsButton = require('ui/Components/ContactUsButton.es6').default;

    return {
      link: function($scope, el) {
        var host = el[0];

        ReactDOM.render(<ContactUsButton />, host);

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(host);
        });
      }
    };
  }
]);
