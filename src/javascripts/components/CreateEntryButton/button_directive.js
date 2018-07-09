angular.module('contentful')
.directive('cfCreateEntryButton', ['require', require => {
  var _ = require('lodash');
  var React = require('react');
  var ReactDOM = require('react-dom');
  var Menu = require('components/CreateEntryButton').default;

  return {
    link: function ($scope, elem, attr) {
      $scope.$watchCollection(() => ({
        contentTypes: _.get($scope, attr.contentTypes, []),
        suggestedContentTypeId: _.get($scope, attr.suggestedContentTypeId),
        size: attr.size,
        style: attr.style,
        text: attr.text,
        disabled: _.get($scope, attr.disabled, false)
      }), props => {
        props = Object.assign({}, props, {
          onSelect: $scope.$eval(attr.onSelect)
        });

        ReactDOM.render(React.createElement(Menu, props), elem[0]);
      });

      // Remember to unmount
      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(elem[0]);
      });
    }
  };
}]);
