angular.module('contentful').directive('cfStateChangeConfirmationDialog', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('react');
    var ReactDOM = require('react-dom');
    var random = require('random');
    var Dialog = require('app/entity_editor/Components/StateChangeConfirmationDialog').default;

    return {
      link: function link ($scope, elem) {
        var dialogSessionId = random.id(); // uuid
        var defaultProps = {
          dialogSessionId: dialogSessionId,
          entityInfo: $scope.entityInfo,
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
