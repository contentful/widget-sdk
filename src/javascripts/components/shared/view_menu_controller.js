'use strict';
angular.module('contentful')

.controller('ViewMenuController', ['$scope', '$attrs', '$injector', '$parse', function($scope, $attrs, $injector, $parse) {
  var modalDialog    = $injector.get('modalDialog');
  var random         = $injector.get('random');
  var $timeout       = $injector.get('$timeout');
  var analytics      = $injector.get('analytics');
  var TheStore       = $injector.get('TheStore');
  var getCurrentView = $parse($attrs.currentView);

  $scope.tempFreeViews = [];
  $scope.folderStates = TheStore.get('folderStates') || {};

  $scope.$watch($attrs.cfViewMenu, function (folders) {
    $scope.folders = folders;
  });

  $scope.toggleFolder = function (folder) {
    if ($scope.folderStates[folder.id] === 'closed') {
      $scope.folderStates[folder.id] = 'open';
    } else {
      $scope.folderStates[folder.id] = 'closed';
    }
    saveFolderStates($scope.folderStates);
  };

  $scope.isFolderOpen = function (folder) {
    return $scope.folderStates[folder.id] !== 'closed';
  };

  function saveFolderStates(folderStates) {
    // Only store closed folders that actually exist
    folderStates = _.pick(folderStates, function (state, folderId) {
      return state === 'closed' && _.find($scope.folders, {id: folderId});
    });
    TheStore.set('folderStates', folderStates);
  }

  $scope.editName = function (item) {
    $scope.$broadcast('startInlineEditor', item);
  };

  $scope.addFolder = function () {
    var folder = {
      title: 'New Folder',
      id: random.id(),
      views: []
    };
    $scope.folders.push(folder);
    $scope.saveViews();
    analytics.trackTotango('Added View Folder');
    $timeout(function () {
      $scope.$broadcast('startInlineEditor', folder);
    });
  };

  $scope.editable = function (folder) {
    return folder.id !== 'default';
  };

  $scope.deleteFolder = function (folder) {
    modalDialog.open({
      title: 'Delete folder',
      message: 'You are about to delete the folder <span class="modal-dialog__highlight">' + folder.title + '</span>. Deleting this Folder will also remove all the saved Views inside.\nIf you want to keep your views, please drag them into another folder before deleting the Folder.',
      confirmLabel: 'Delete',
      scope: $scope
    }).promise.then(function () {
      _.remove($scope.folders, {id: folder.id});
      analytics.trackTotango('Deleted View Folder');
      return $scope.saveViews();
    });
  };

  $scope.addViewToDefault = function () {
    var defaultFolder = $scope.createDefaultFolder();
    $scope.addViewToFolder(defaultFolder);
  };

  $scope.addViewToFolder = function (folder) {
    var view = getCurrentView($scope);
    view.id = random.id();
    folder.views.push(view);
    $scope.saveViews();
    analytics.trackTotango('Added View');

    $timeout(function () {
      $scope.$broadcast('startInlineEditor', view);
    });
  };

  $scope.cleanDefaultFolder = function () {
    _.remove($scope.folders, function (folder) {
      return folder.id === 'default' && folder.views.length === 0;
    });
  };

  $scope.createDefaultFolder = function () {
    var defaultFolder = _.find($scope.folders, {id: 'default'});
    if (!defaultFolder) {
      defaultFolder = {
        id: 'default',
        title: 'Views',
        views: []
      };
      $scope.folders.unshift(defaultFolder);
    }
    return defaultFolder;
  };

  $scope.viewIsActive = function (view){
    if (!view) return false;
    var p = getCurrentView($scope);
    return p.id === view.id;
  };


  function moveTempFreeViews() {
    var defaultFolder = $scope.createDefaultFolder();
    defaultFolder.views.push.apply(defaultFolder.views, $scope.tempFreeViews);
    $scope.tempFreeViews.length = 0;
  }

  $scope.showTempFreeViews = function () {
    var hasDefaultFolder = _.find($scope.folders, {id: 'default'});
    return $scope.draggingView && !hasDefaultFolder;
  };

  $scope.$on('editingStarted', function () {
    $scope.insideInlineEditor = true;
  });
  $scope.$on('editingStopped', function () {
    $scope.insideInlineEditor = false;
  });

  $scope.$watch('canEditUiConfig && !insideInlineEditor', function (can) {
    $scope.viewMenuEditable = can;
    $scope.viewSortOptions.disabled = !can;
    $scope.folderSortOptions.disabled = !can;
  });

  $scope.viewSortOptions = {
    connectWith: '[ui-sortable=viewSortOptions]',
    placeholder: 'filter-list-item-placeholder',
    axis: 'y',
    start: function () {
      $scope.draggingView = true;
      $scope.$apply();
    },
    stop: function () {
      $scope.draggingView = false;
      moveTempFreeViews();
      $scope.cleanDefaultFolder();
      $scope.saveViews();
    }
  };

  $scope.folderSortOptions = {
    items: '.allow-drag',
    axis: 'y',
    handle: 'header',
    stop: function () {
      $scope.saveViews();
    }
  };

  $scope.nameChanged = function () {
    $scope.saveViews();
  };
}]);
