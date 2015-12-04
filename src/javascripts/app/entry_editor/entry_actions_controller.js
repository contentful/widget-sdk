'use strict';

angular.module('contentful')
.controller('EntryActionsController',
['$scope', '$injector', 'notify', function ($scope, $injector, notify) {

  var controller    = this;
  var Command       = $injector.get('command');
  var spaceContext  = $injector.get('spaceContext');
  var $state        = $injector.get('$state');
  var analytics     = $injector.get('analytics');
  var accessChecker = $injector.get('accessChecker');

  function disabledChecker (action) {
    return function () {
      return !accessChecker.canPerformActionOnEntity(action, $scope.entry);
    };
  }


  controller.duplicate = Command.create(function () {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    return $scope.spaceContext.space.createEntry(contentType, data)
    .then(function(entry){
      $state.go('spaces.detail.entries.detail', { entryId: entry.getId(), addToContext: true });
    })
    .catch(notify.duplicateFail);
  }, {
    disabled: disabledChecker('createEntry')
  });



  controller.toggleDisabledFields = Command.create(function () {
    var show = !$scope.preferences.showDisabledFields;
    trackToggleDisabledFields(show);
    $scope.preferences.showDisabledFields = show;
  }, {}, {
    label: function () {
      return $scope.preferences.showDisabledFields ?
               'Hide disabled fields' :
               'Show disabled fields';
    }
  });


  controller.add = Command.create(function () {
    analytics.track('Clicked Create new Entry of same CT');
    var contentTypeId = $scope.entry.getSys().contentType.sys.id;
    return spaceContext.space.createEntry(contentTypeId, {})
    .then(function (entry) {
      // TODO Create a service that works like $state.go but cancels
      // anythings if the state has changed in the meantime
      $state.go('spaces.detail.entries.detail', {
        entryId: entry.getId(),
        addToContext: true
      });
    });
    // TODO error handler
  }, {
    disabled: disabledChecker('createEntry')
  }, {
    name: function () { return $scope.contentTypeName; }
  });

  /**
   * @ngdoc analytics-event
   * @name Show Disabled Fields
   */
  /**
   * @ngdoc analytics-event
   * @name Hide Disabled Fields
   */
  function trackToggleDisabledFields (show) {
    if (show) {
      analytics.track('Show Disabled Fields');
    } else {
      analytics.track('Hide Disabled Fields');
    }
  }

}]);
