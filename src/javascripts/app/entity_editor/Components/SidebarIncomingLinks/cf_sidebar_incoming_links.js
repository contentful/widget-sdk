angular.module('contentful').directive('cfSidebarIncomingLinks', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var SidebarIncomingLinks = require('app/entity_editor/Components/SidebarIncomingLinks')
      .default;

    return {
      link: function link ($scope, elem) {
        var entityInfo = $scope.entityInfo;
        var defaultProps = {
          entityInfo: entityInfo
        };

        function render (props) {
          ReactDOM.render(
            React.createElement(
              SidebarIncomingLinks,
              _.extend({}, defaultProps, props)
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
