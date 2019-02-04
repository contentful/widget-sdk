import { registerDirective } from 'NgRegistry.es6';
import React from 'react';
import ReactDOM from 'react-dom';
import * as random from 'utils/Random.es6';

export default function register() {
  registerDirective('cfStateChangeConfirmationDialog', [
    'app/entity_editor/Components/StateChangeConfirmationDialog',
    ({ default: Dialog }) => ({
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
    })
  ]);
}
