'use strict';

angular.module('contentful')
.controller('entityEditor/StatusNotificationsController', ['$scope', 'entityLabel', 'isReadOnly', function ($scope, entityLabel, isReadOnly) {
  var controller = this;
  var messages = {
    'ot-connection-error':
      'It appears that you aren’t connected to internet at the moment. ' +
      'The fields are temporarily locked so that you won’t lose any important changes.',
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
  function getStatus () {
    if (hasLostConnection()) {
      return 'ot-connection-error';
    }

    if (isReadOnly()) {
      return 'editing-not-allowed';
    }

    if ($scope.entity.isArchived()) {
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

  function hasLostConnection () {
    return $scope.otDoc.state.error;
  }
}]);
