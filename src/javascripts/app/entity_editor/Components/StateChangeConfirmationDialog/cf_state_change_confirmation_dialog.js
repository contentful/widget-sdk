angular.module('contentful').directive('cfStateChangeConfirmationDialog', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('libs/react');
    var ReactDOM = require('libs/react-dom');
    var Dialog = require('app/entity_editor/Components/StateChangeConfirmationDialog').default;

    return {
      link: function link ($scope, elem) {
        var entityInfo = $scope.entityInfo;
        var defaultProps = {
          entityInfo: entityInfo,
          action: $scope.action,
          onConfirm: function () {
            $scope.dialog.confirm();
          },
          onCancel: function () {
            $scope.dialog.cancel();
          }
        };

        function render (props) {
          ReactDOM.render(
            React.createElement(
              Dialog,
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
