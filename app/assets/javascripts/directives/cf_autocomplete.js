angular.module('contentful/directives').directive('cfAutocomplete', function(Paginator){
  'use strict';

  return {
    restrict: 'A',
    template: JST['cf_autocomplete'],
    link: function($scope, element) {
      $scope.searchTerm = '';
      $scope.paginator = new Paginator();
      $scope.selectedItem = 0;

      $scope.$watch('searchTerm', function(n,o, scope) {
        if (n === o) return;
        scope.paginator.page = 0;
        $scope.selectedItem = 0;
        scope.resetEntries();
      });

      $scope.resetEntries = function() {
        if ($scope.reloadInProgress || $scope.resetPaused) return;

        if (!$scope.searchTerm || $scope.searchTerm.length === 0) {
          $scope.entries = [];
          return;
        }

        $scope.reloadInProgress = true;
        $scope.bucketContext.bucket.getEntries($scope.buildQuery(), function(err, entries, sys) {
          $scope.reloadInProgress = false;
          if (err) return;
          $scope.paginator.numEntries = sys.total;
          $scope.$apply(function(scope){
            scope.selectedItem = 0;
            scope.entries = entries;
          });
        });
      };

      $scope.buildQuery = function() {
        var queryObject = {
          order: '-sys.updatedAt',
          limit: $scope.paginator.pageLength,
          skip: $scope.paginator.skipItems()
        };

        //queryObject['sys.publishedAt[gt]'] = 0;

        // TODO here, respect the type restriction of the link
        // queryObject['sys.entryType'] = whatever
        // This can't be done without the constraints though

        if ($scope.searchTerm && 0 < $scope.searchTerm.length) {
          queryObject.query = $scope.searchTerm;
        }

        return queryObject;
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
        $scope.reloadInProgress = true;
        $scope.pauseReset();
        $scope.bucketContext.bucket.getEntries($scope.buildQuery(), function(err, entries, sys) {
          $scope.reloadInProgress = false;
          if (err) {
            $scope.paginator.page--;
            return;
          }
          $scope.paginator.numEntries = sys.total;
          $scope.$apply(function(scope){
            var args = [scope.entries.length, 0].concat(entries);
            scope.entries.splice.apply(scope.entries, args);
          });
        });

      };

      element.on('keydown', function(event) {
        var DOWN  = 40,
            UP    = 38,
            ENTER = 13,
            ESC   = 27;

        if (event.keyCode == DOWN){
          $scope.selectNext();
          $scope.$digest();
          event.preventDefault();
        } else if (event.keyCode == UP) {
          $scope.selectPrevious();
          $scope.$digest();
          event.preventDefault();
        } else if (event.keyCode == ESC) {
          $scope.$apply(function(scope) {
            scope.closePicker();
          });
          event.preventDefault();
        } else if (event.keyCode == ENTER) {
          $scope.$apply(function(scope) {
            scope.pickSelected();
          });
          event.preventDefault();
          event.stopPropagation();
        }
      });

      var scrollToSelected = function() {
        var selected = element.find('.selected')[0];
        var $container = element.find('.endless-container');
        var above = selected.offsetTop <= $container.scrollTop();
        var below = $container.scrollTop() + $container.height()<= selected.offsetTop;
        if (above) {
          selected.scrollIntoView(true);
        } else if (below) {
          selected.scrollIntoView(false);
        }
      };

      $scope.selectNext = function() {
        if ($scope.selectedItem < $scope.paginator.numEntries-1) {
          $scope.selectedItem++;
          _.defer(scrollToSelected);
        }
      };

      $scope.selectPrevious = function() {
        if (0 < $scope.selectedItem) $scope.selectedItem--;
        _.defer(scrollToSelected);
      };

      $scope.closePicker = function() {
        $scope.searchTerm = '';
      };

      $scope.pickSelected = function() {
        var entry = $scope.entries[$scope.selectedItem];
        if (entry) {
          $scope.setLink(entry, function(err) {
            if (!err) $scope.closePicker();
          });
        }
      };

      $scope.removeLink = function() {
        return $scope.changeValue(null, function(err) {
          if (!err) $scope.$apply(function(scope) {
            scope.linkedEntry = null;
          });
        });
      };

      $scope.setLink = function(entry, callback) {
        var link = {
          sys: {
            type: 'link',
            linkType: 'entry',
            id: entry.getId()
            }};
        $scope.changeValue(link, function(err) {
          $scope.$apply(function(scope) {
            if (err) {
              callback(err);
            } else {
              scope.linkedEntry = entry;
              callback(null);
            }
          });
        });
      };

      $scope.visitLink = function() {
        var entry = $scope.linkedEntry;
        var editor = _.find($scope.bucketContext.tabList.items, function(tab){
          return (tab.viewType == 'entry-editor' && tab.params.entry.getId() == entry.getId());
        });
        if (!editor) {
          editor = $scope.bucketContext.tabList.add({
            viewType: 'entry-editor',
            section: 'entries',
            params: {
              entry: entry,
              mode: 'edit'
            },
            title: this.bucketContext.entryTitle(entry)
          });
        }
        editor.activate();
      };

      $scope.addNew = function(entryType) {
        $scope.bucketContext.bucket.createEntry({
          sys: {
            entryType: entryType.getId()
          }
        }, function(errCreate, entry){
          if (errCreate) {
            console.log('Error creating entry', errCreate);
            return;
          }
          $scope.setLink(entry, function(errSetLink) {
            if (errSetLink) {
              console.log('Error linking entry', errSetLink);
              entry.delete(function(errDelete) {
                console.log('Error deleting entry', errDelete);
              });
              return;
            }
            $scope.bucketContext.tabList.add({
              viewType: 'entry-editor',
              section: 'entries',
              params: {
                entry: entry,
                bucket: $scope.bucketContext.bucket,
                mode: 'create'
              },
              title: 'New Entry'
            }).activate();
          });
        });
      };


      $scope.setLinkedEntryFromValue = function(value) {
        var linkedId = value && value.sys && value.sys.id;
        if(linkedId) {
          if (value.sys.linkType == 'entry') {
            $scope.bucketContext.bucket.getEntry(linkedId, function(err, entry) {
              if (!err) $scope.$apply(function(scope) {
                scope.linkedEntry = entry;
              });
            });
          }
        } else {
          $scope.linkedEntry = null;
        }
      };
      $scope.setLinkedEntryFromValue($scope.value);

      $scope.$on('valueChanged', function(event, value) {
        event.currentScope.setLinkedEntryFromValue(value);
      });

      $scope.currentLinkDescription = function() {
        if ($scope.linkedEntry) {
          return $scope.bucketContext.entryTitle($scope.linkedEntry, $scope.locale);
        } else {
          return '(nothing)';
        }
      };

    }
  };
});

