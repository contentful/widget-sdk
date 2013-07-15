'use strict';

angular.module('contentful').directive('cfAutocompleteSearch', function(Paginator, cfSpinner, notification) {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      scope.$watch('selectedItem', function () {
        scrollToSelected();
      });

      function scrollToSelected(){
        var selected = element.find('.selected')[0];
        if (!selected) return;
        var $container = element.find('.endless-container');
        var above = selected.offsetTop <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height()<= selected.offsetTop;
        if (above) {
          selected.scrollIntoView(true);
        } else if (below) {
          selected.scrollIntoView(false);
        }
      }
    },
    controller: function cfAutocompleteSearchCtrl($scope){
      $scope.paginator = new Paginator();

      $scope.$watch('searchTerm', function(term, old, scope) {
        scope.resetEntries();
      });

      $scope.$on('searchResultSelected', function (event, index, entry) {
        event.currentScope.selectedEntry = entry;
      });

      $scope.$on('searchResultPicked', function (event, index, entry) {
        event.currentScope.addLink(entry, function(err) {
          if (err) event.preventDefault();
        });
      });

      $scope.pick = function (entry) {
        $scope.addLink(entry, function(err) {
          if (!err) $scope.searchTerm = '';
        });
      };


      $scope.addNew = function(contentType) {
        $scope.spaceContext.space.createEntry(contentType.getId(), {}, function(errCreate, entry){
          if (errCreate) {
            //console.log('Error creating entry', errCreate);
            notification.error('Error creating entry');
            throw new Error('Error creating entry in cfAutocomplete');
          }
          $scope.addLink(entry, function(errSetLink) {
            if (errSetLink) {
              notification.error('Error linking entry');
              //console.log('Error linking entry', errSetLink);
              entry.delete(function(errDelete) {
                if (errDelete) {
                  //console.log('Error deleting entry', errDelete);
                  notification.error('Error deleting entry again');
                  throw new Error('Error deleting entry in cfAutocomplete');
                }
              });
              throw new Error('Error linking entry in cfAutocomplete');
            }
            $scope.editEntry(entry, 'create');
          });
        });
      };

      $scope.resetEntries = function() {
        if ($scope.reloadInProgress || $scope.resetPaused) return;

        if (!$scope.searchTerm || $scope.searchTerm.length === 0) {
          $scope.paginator.page = 0;
          $scope.entries = [];
          $scope.selectedEntry = null;
          return;
        }

        $scope.reloadInProgress = true;
        var stopSpin = cfSpinner.start();
        $scope.spaceContext.space.getEntries(buildQuery(), function(err, entries, stats) {
          $scope.$apply(function(scope){
            scope.reloadInProgress = false;
            if (err) return;
            scope.paginator.numEntries = stats.total;
            scope.entries = entries;
            scope.selectedEntry = entries[0];
            stopSpin();
          });
        });
      };

      $scope.pauseReset = function() {
        if ($scope.resetPaused) return;
        $scope.resetPaused = true;
        setTimeout(function() {
          $scope.resetPaused = false;
        }, 500);
      };

      $scope.loadMore = function() {
        if ($scope.reloadInProgress || $scope.resetPaused) return;
        if ($scope.paginator.atLast()) return;
        $scope.paginator.page++;
        $scope.pauseReset();
        $scope.spaceContext.space.getEntries(buildQuery(), function(err, entries, stats) {
          $scope.reloadInProgress = false;
          if (err) {
            $scope.paginator.page--;
            return;
          }
          $scope.paginator.numEntries = stats.total;
          $scope.$apply(function(scope){
            var args = [scope.entries.length, 0].concat(entries);
            scope.entries.splice.apply(scope.entries, args);
          });
        });

        $scope.apply(function(scope) {
          scope.reloadInProgress = true;
        });
      };

      function buildQuery() {
        var queryObject = {
          order: '-sys.updatedAt',
          limit: $scope.paginator.pageLength,
          skip: $scope.paginator.skipItems()
        };

        if ($scope.linkContentType)
          queryObject['sys.contentType.sys.id'] = $scope.linkContentType.getId();
        if ($scope.searchTerm && 0 < $scope.searchTerm.length)
          queryObject.query = $scope.searchTerm;

        return queryObject;
      }

    }};
});
