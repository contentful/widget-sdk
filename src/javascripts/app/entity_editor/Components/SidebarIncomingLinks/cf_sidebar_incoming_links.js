angular.module('contentful').directive('cfSidebarIncomingLinks', [
  'require',
  require => {
    const _ = require('lodash');
    const React = require('react');
    const ReactDOM = require('react-dom');
    const SidebarIncomingLinks = require('app/entity_editor/Components/SidebarIncomingLinks')
      .default;

    return {
      link: function link($scope, elem) {
        const entityInfo = $scope.entityInfo;
        const defaultProps = {
          entityInfo: entityInfo
        };

        function render(props) {
          ReactDOM.render(
            React.createElement(SidebarIncomingLinks, _.extend({}, defaultProps, props)),
            elem[0]
          );
        }

        render();

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
