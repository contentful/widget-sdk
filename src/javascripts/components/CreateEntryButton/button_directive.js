angular.module('contentful').directive('cfCreateEntryButton', [
  'require',
  require => {
    const _ = require('lodash');
    const React = require('react');
    const ReactDOM = require('react-dom');
    const Menu = require('components/CreateEntryButton').default;

    return {
      link: function ($scope, elem, attr) {
        $scope.$watchCollection(
          () => {
            const contentTypes = _.get($scope, attr.contentTypes, []);
            const disabled = contentTypes.length === 0;
            return {
              contentTypes,
              suggestedContentTypeId: _.get(
                $scope,
                attr.suggestedContentTypeId
              ),
              size: attr.size,
              style: attr.style,
              text: attr.text,
              disabled
            };
          },
          props => {
            props = Object.assign({}, props, {
              onSelect: $scope.$eval(attr.onSelect)
            });

            ReactDOM.render(React.createElement(Menu, props), elem[0]);
          }
        );

        // Remember to unmount
        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
