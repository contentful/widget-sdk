angular.module('contentful').directive('cfStateChangeConfirmationDialog', [
  'require',
  require => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const random = require('utils/Random.es6');
    const Dialog = require('app/entity_editor/Components/StateChangeConfirmationDialog').default;

    return {
      link: function link($scope, elem) {
        const dialogSessionId = random.id(); // uuid
        const defaultProps = {
          dialogSessionId: dialogSessionId,
          entityInfo: $scope.entityInfo,
          action: $scope.action,
          onConfirm: function() {
            $scope.dialog.confirm();
          },
          onCancel: function() {
            $scope.dialog.cancel();
          }
        };

        function render(props) {
          ReactDOM.render(<Dialog {...defaultProps} {...props} />, elem[0]);
        }

        render();

        $scope.$on('$destroy', () => {
          ReactDOM.unmountComponentAtNode(elem[0]);
        });
      }
    };
  }
]);
