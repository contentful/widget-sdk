'use strict';

angular.module('contentful').directive('cfLinkEditorSearch', function(Paginator, notification, PromisedLoader) {
  return {
    restrict: 'AC',
    link: function (scope, element) {
      scope.$watch('selectedEntity', function () {
        _.defer(scrollToSelected);
      });

      function scrollToSelected(){
        var $selected = element.find('.selected');
        if ($selected.length === 0) return;
        var $container = element.find('.endless-container');
        var above = $selected.prop('offsetTop') <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height() <= $selected.prop('offsetTop');
        if (above) {
          $container.scrollTop($selected.prop('offsetTop'));
        } else if (below) {
          $container.scrollTop($selected.prop('offsetTop')-$container.height() + $selected.height());
        }
      }
    },
    controller: function cfLinkEditorSearchCtrl($scope){

      var entityLoader = new PromisedLoader();

      $scope.paginator = new Paginator();

      $scope.$watch('searchTerm', function(term, old, scope) {
        scope.resetEntities();
      });

      $scope.$on('autocompleteResultSelected', function (event, index, entity) {
        event.currentScope.selectedEntity = entity;
      });

      $scope.$on('autocompleteResultPicked', function (event, index, entity) {
        event.currentScope.addLink(entity, function(err) {
          if (err) event.preventDefault();
        });
      });

      $scope.pick = function (entity) {
        $scope.addLink(entity, function(err) {
          if (!err) $scope.searchTerm = '';
        });
      };


      $scope.addNew = function(contentType) {
        $scope.spaceContext.space.createEntry(contentType.getId(), {}, function(errCreate, entry){
          if (errCreate) {
            //console.log('Error creating entry', errCreate);
            notification.error('Error creating entry');
            throw new Error('Error creating entry in cfLinkEditor');
          }
          $scope.addLink(entry, function(errSetLink) {
            if (errSetLink) {
              notification.error('Error linking entry');
              //console.log('Error linking entry', errSetLink);
              entry.delete(function(errDelete) {
                if (errDelete) {
                  //console.log('Error deleting entry', errDelete);
                  notification.error('Error deleting entry again');
                  throw new Error('Error deleting entry in cfLinkEditor');
                }
              });
              throw new Error('Error linking entry in cfLinkEditor');
            }
            $scope.editEntry(entry, 'create');
          });
        });
      };

      $scope.resetEntities = function() {
        if (_.isEmpty($scope.searchTerm)) {
          $scope.paginator.page = 0;
          $scope.entities = [];
          $scope.selectedEntity = null;
        } else {
          entityLoader.load($scope.spaceContext.space, $scope.fetchMethod, buildQuery()).
          then(function (entities) {
            $scope.paginator.numEntries = entities.total;
            $scope.entities = entities;
            $scope.selectedEntity = entities[0];
          });
        }
      };

      $scope.loadMore = function() {
        if ($scope.paginator.atLast()) return;
        $scope.paginator.page++;
        entityLoader.load($scope.spaceContext.space, $scope.fetchMethod, buildQuery()).
        then(function (entities) {
          $scope.paginator.numEntries = entities.total;
          $scope.entities.push.apply($scope.entities, entities);
        }, function () {
          $scope.paginator.page--;
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
