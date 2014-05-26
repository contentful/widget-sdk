'use strict';
angular.module('contentful').directive('viewMenu', function(modalDialog, random, $timeout){
  return {
    restrict: 'A',
    template: JST['view_menu'](),
    controller: function ($scope, $attrs) {
      $scope.tempFreeViews = [];
      $scope.folderStates = {};

      $scope.$watch($attrs.viewMenu, function (folders) {
        $scope.folders = folders;
      });

      $scope.toggleFolder = function (folder) {
        if ($scope.folderStates[folder.id] === 'closed') {
          $scope.folderStates[folder.id] = 'open';
        } else {
          $scope.folderStates[folder.id] = 'closed';
        }
      };

      $scope.isFolderOpen = function (folder) {
        return $scope.folderStates[folder.id] !== 'closed';
      };

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
        $scope.saveEntryListViews();
        $timeout(function () {
          $scope.$broadcast('startInlineEditor', folder);
        });
      };

      $scope.editable = function (folder) {
        return folder.id !== 'default';
      };

      $scope.deleteFolder = function (folder) {
        modalDialog.open({
          title: 'Delete Folder "' + folder.title + '"?',
          message: 'Deleting this Folder will also delete all Views inside the folder.\nIf you want to keep your views, drag them into another folder first.',
          confirmLabel: 'Delete Folder',
          scope: $scope
        }).then(function () {
          _.remove($scope.folders, {id: folder.id});
          return $scope.saveEntryListViews();
        });
      };

      $scope.addViewToDefault = function () {
        var defaultFolder = $scope.createDefaultFolder();
        $scope.addViewToFolder(defaultFolder);
      };

      $scope.addViewToFolder = function (folder) {
        var view = $scope.tab.params.view;
        view.id = random.id();
        folder.views.push(view);
        $scope.saveEntryListViews();

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

      $scope.$watch('canEditUiConfig', function (can) {
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
          $scope.cleanDefaultFolder();
          $scope.saveEntryListViews();
        }
      };

      $scope.folderSortOptions = {
        items: '.allow-drag',
        axis: 'y',
        handle: 'header',
        stop: function () {
          $scope.saveEntryListViews();
        }
      };

      $scope.nameChanged = function () {
        $scope.saveEntryListViews();
      };
    }
  };
});
