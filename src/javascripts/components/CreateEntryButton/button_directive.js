angular.module('contentful')
.directive('cfCreateEntryButton', ['require', function (require) {
  var _ = require('lodash');
  var React = require('libs/react');
  var ReactDOM = require('libs/react-dom');
  var Menu = require('components/CreateEntryButton').default;

  return {
    link: function ($scope, elem, attr) {
      $scope.$watchCollection(function () {
        return {
          contentTypes: _.get($scope, attr.contentTypes, []),
          suggestedContentTypeId: _.get($scope, attr.suggestedContentTypeId),
          size: attr.size,
          style: attr.style,
          text: attr.text
        };
      }, function (props) {
        props = Object.assign({}, props, {
          onSelect: $scope.$eval(attr.onSelect)
        });

        ReactDOM.render(React.createElement(Menu, props), elem[0]);
      });

      // Remember to unmount
      $scope.$on('$destroy', function () {
        ReactDOM.unmountComponentAtNode(elem[0]);
      });
    }
  };
}]);
