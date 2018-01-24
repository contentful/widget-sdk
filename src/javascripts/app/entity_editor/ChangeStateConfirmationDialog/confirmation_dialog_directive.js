angular.module('contentful').directive('cfChangeStateConfirmationDialog', [
  'require',
  function (require) {
    var _ = require('lodash');
    var React = require('libs/react');
    var ReactDOM = require('libs/react-dom');

    var Dialog = require('app/entity_editor/ChangeStateConfirmationDialog/Component').default;
    var constants = require('app/entity_editor/ChangeStateConfirmationDialog/Component/constants');
    var fetchLinksToEntity = require('app/entity_editor/ChangeStateConfirmationDialog/fetchLinksToEntity').default;

    return {
      link: function link ($scope, elem) {
        var entityInfo = $scope.entityInfo;
        var defaultProps = {
          links: [],
          entityInfo: entityInfo,
          action: $scope.action,
          requestState: constants.RequestState.PENDING,
          onConfirm: function () {
            $scope.dialog.confirm();
          },
          onCancel: function () {
            $scope.dialog.cancel();
          }
        };

        fetchLinksToEntity(entityInfo.id, entityInfo.type).then(
          function (links) {
            render({
              links: links,
              requestState: constants.RequestState.SUCCESS
            });
          },
          function () {
            render({
              links: [],
              requestState: constants.RequestState.ERROR
            });
          }
        );

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
