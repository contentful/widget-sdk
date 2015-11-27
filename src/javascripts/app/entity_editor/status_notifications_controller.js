'use strict';

angular.module('contentful')
.controller('entityEditor/StatusNotificationsController',
['$scope', 'entityLabel', 'isReadOnly', function ($scope, entityLabel, isReadOnly) {
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

  // TODO this method depends on two objects defined on the scope. We
  // need better abstraction.
  function getStatus (scope) {
    if (scope.otDoc.state.error) {
      return 'ot-connection-error';
    }

    if (isReadOnly()) {
      return 'editing-not-allowed';
    }

    if (scope[entityLabel].isArchived()) {
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
