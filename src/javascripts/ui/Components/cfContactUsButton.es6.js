'use strict';

angular.module('contentful').directive('cfContactUsButton', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const ContactUsButton = require('ui/Components/ContactUsButton.es6').default;

    return {
      link: function($scope, el) {
        const host = el[0];

        ReactDOM.render(<ContactUsButton />, host);

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(host);
        });
      }
    };
  }
]);
