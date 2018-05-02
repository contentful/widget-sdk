angular.module('contentful').directive('cfBackNav', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var BackNav = require('app/entity_editor/Components/BackNav').default;

    return {
      link: function link ($scope, elem) {
        function render (props) {
          ReactDOM.render(
            React.createElement(
              BackNav,
              _.extend({}, props)
            ),
            elem[0]
          );
        }

        render();

        $scope.$on('$destroy', function () {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
