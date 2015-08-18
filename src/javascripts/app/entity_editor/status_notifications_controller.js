'use strict';

angular.module('contentful')
.controller('entityEditor/StatusNotificationsController',
['$scope', 'entityLabel', function ($scope, entityLabel) {
  var controller = this;
  var messages = {
    'ot-connection-error':
      'We have lost the connection to our server and disabled editing '+
      'features, please verify you have internet access.',
    'archived':
      'This ' + entityLabel + ' is archived and cannot be ' +
      'modified. Please unarchive it to make any changes.',
    'editing-not-allowed':
      'You have read-only access to this ' + entityLabel + '. If you need to edit ' +
      'it please contact your administrator.'
  };

  $scope.$watch(getStatus, function (status) {
    controller.status = status;
    if (status) {
      controller.message = getMessage(status);
    } else {
      controller.message = null;
    }
  });

  // TODO this method depends on three objects defined on the scope. We
  // need better abstraction.
  function getStatus (scope) {
    var entity = scope[entityLabel];
    if (scope.otDoc.state.error) {
      return 'ot-connection-error';
    }

    var canUpdate = scope.permissionController.can('update', entity.data).can;
    if (!canUpdate) {
      return 'editing-not-allowed';
    }

    if (entity.isArchived()) {
      return 'archived';
    }
  }

  function getMessage (id) {
    if (id in messages) {
      return messages[id];
    } else {
      throw new Error('Unknown message id ' + JSON.stringify(id));
    }

  }

}]);
