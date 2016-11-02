angular.module('contentful')
.directive('cfEditorStatusNotification', ['require', function (require) {
  var K = require('utils/kefir');
  var messages = {
    'ot-connection-error':
      _.template(
        'It appears that you aren’t connected to internet at the moment. ' +
        'The fields are temporarily locked so that you won’t lose any ' +
        'important changes.'
      ),
    'archived':
      _.template(
        'This ${entityLabel} is archived and cannot be ' +
        'modified. Please unarchive it to make any changes.'
      ),
    'editing-not-allowed':
      _.template(
        'You have read-only access to this ${entityLabel}. If you need to edit ' +
        'it please contact your administrator.'
      )
  };

  return {
    restrict: 'E',
    scope: {
      // string
      entityLabel: '@',
      // Property<string>
      status: '<'
    },
    template:
      '<div class="entity-editor__notification" ng-if="message" role="alert">' +
        '<p ng-bind="message"></p>' +
      '</div>',
    link: function ($scope) {
      K.onValueScope($scope, $scope.status, function (status) {
        if (status === 'ok') {
          $scope.message = null;
        } else {
          $scope.message = getMessage($scope.entityLabel, status);
        }
      });
    }
  };


  function getMessage (entityLabel, id) {
    if (id in messages) {
      return messages[id]({entityLabel: entityLabel});
    } else {
      throw new Error('Unknown message id ' + JSON.stringify(id));
    }
  }

}]);
