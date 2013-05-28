angular.module('contentful').directive('cfAutocomplete', function(Paginator, ShareJS, cfSpinner, validation){
  'use strict';

  return {
    restrict: 'A',
    template: JST['cf_autocomplete'],
    link: function($scope, element, attrs) {
      // $scope.value              contains the Link/list of links
      $scope.linkedEntries = []; //contains the linked Entry

      var linkEntryTypeValidation = _($scope.field.validations)
        .map(validation.Validation.parse)
        .where({name: 'linkEntryType'})
        .first();

      if (linkEntryTypeValidation) {
        $scope.linkEntryType = _.find($scope.bucketContext.publishedEntryTypes, function(et) {
          return et.getId() == linkEntryTypeValidation.entryTypeId;
        });
      }

      $scope.removeLink = function(entry) {
        if (attrs.cfAutocomplete === 'entry') {
          return $scope.otChangeValue(null, function(err) {
            if (!err) $scope.$apply(function(scope) {
              scope.linkedEntries.length = 0;
              scope.otUpdateEntity();
            });
          });
        } else {
          var entryIndex = _.indexOf($scope.linkedEntries, entry);
          $scope.otDoc.at($scope.otPath.concat(entryIndex)).remove(function (err) {
            if (!err) $scope.$apply(function(scope) {
              scope.linkedEntries.splice(entryIndex,1);
              scope.otUpdateEntity();
            });
          });
        }
      };

      $scope.addLink = function(entry, callback) {
        var link = {
          sys: {
            type: 'link',
            linkType: 'entry',
            id: entry.getId()
          }
        };
        if (attrs.cfAutocomplete === 'entry') {
          $scope.otChangeValue(link, function(err) {
            $scope.$apply(function(scope) {
              if (err) {
                callback(err);
              } else {
                scope.linkedEntries.length = 1;
                scope.linkedEntries[0] = entry;
                scope.otUpdateEntity();
                callback(null);
              }
            });
          });
        } else {
          if (_.isArray(ShareJS.peek($scope.otDoc, $scope.otPath))) {
            $scope.otDoc.at($scope.otPath).push(link, function (err) {
              $scope.$apply(function(scope) {
                if (err) {
                  callback(err);
                } else {
                  scope.linkedEntries.push(entry);
                  scope.otUpdateEntity();
                  callback(null);
                }
              });
            });
          } else {
            ShareJS.mkpath($scope.otDoc, $scope.otPath, [link], function (err) {
              $scope.$apply(function(scope) {
                if (err) {
                  callback(err);
                } else {
                  scope.linkedEntries = [entry];
                  scope.otUpdateEntity();
                  callback(null);
                }
              });
            });
          }
        }

      };

      $scope.visitLink = function(entry) {
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
        $scope.bucketContext.bucket.createEntry(entryType.getId(), {}, function(errCreate, entry){
          if (errCreate) {
            console.log('Error creating entry', errCreate);
            return;
          }
          $scope.addLink(entry, function(errSetLink) {
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

      $scope.setLinkedEntriesFromValue = function(value) {
        var stopSpin;
        if (attrs.cfAutocomplete === 'entries') {
          // TODO case where value is null? Shouldn't occur, but still...
          var ids = _.map(value, function (link) { return link.sys.id; }).join(',');
          stopSpin = cfSpinner.start();
          $scope.bucketContext.bucket.getEntries({'sys.id[in]': ids}, function (err, entries) {
            entries = _.reduce(entries, function (map, entry) {
              map[entry.getId()] = entry;
              return map;
            }, {} );
            entries = _.map(value, function (link) { return entries[link.sys.id]; });
            $scope.$apply(function (scope) {
              scope.linkedEntries.splice.apply(scope.linkedEntries, [0, scope.linkedEntries.length].concat(entries));
            });
            stopSpin();
          });
        } else {
          var linkedId = value && value.sys && value.sys.id;
          if(linkedId) {
            if (value.sys.linkType == 'entry') {
              stopSpin = cfSpinner.start();
              $scope.bucketContext.bucket.getEntry(linkedId, function(err, entry) {
                if (!err) $scope.$apply(function(scope) {
                  scope.linkedEntries.length = 1;
                  scope.linkedEntries[0] = entry;
                });
                stopSpin();
              });
            }
          } else {
            $scope.linkedEntries = [];
          }
        }

      };

      $scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) event.currentScope.setLinkedEntriesFromValue(value);
      });

      $scope.linkDescription= function(entry) {
        if (entry) {
          return $scope.bucketContext.entryTitle(entry, $scope.locale.code);
        } else {
          return '(nothing)';
        }
      };

      // TODO: When integrating Media, refactor the actual search widget out of the directive,
      // create a proper interface and then have different lists for the different types

      // Search ///////////////////////////////////////////////////////////////
      $scope.$watch('searchTerm', function() {
        $scope.paginator.page = 0;
        $scope.selectedItem = 0;
        $scope.resetEntries();
      });

      $scope.resetEntries = function() {
        if ($scope.reloadInProgress || $scope.resetPaused) return;

        if (!$scope.searchTerm || $scope.searchTerm.length === 0) {
          $scope.entries = [];
          return;
        }

        $scope.reloadInProgress = true;
        var stopSpin = cfSpinner.start();
        $scope.bucketContext.bucket.getEntries($scope.buildQuery(), function(err, entries, stats) {
          $scope.reloadInProgress = false;
          if (err) return;
          $scope.paginator.numEntries = stats.total;
          $scope.$apply(function(scope){
            scope.selectedItem = 0;
            scope.entries = entries;
            stopSpin();
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

        if ($scope.linkEntryType)
          queryObject['sys.entryType.sys.id'] = $scope.linkEntryType.getId();

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

      // Display matches ///////////////////////////////////////////////////////
      $scope.paginator = new Paginator();
      $scope.selectedItem = 0;

      $scope.loadMore = function() {
        if ($scope.reloadInProgress || $scope.resetPaused) return;
        if ($scope.paginator.atLast()) return;
        $scope.paginator.page++;
        $scope.pauseReset();
        $scope.bucketContext.bucket.getEntries($scope.buildQuery(), function(err, entries, stats) {
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

      element.on('keydown', function navigateResultList(event) {
        var DOWN  = 40,
            UP    = 38,
            ENTER = 13,
            ESC   = 27;

        if (event.keyCode == DOWN){
          if ($scope.hasResults()) {
            $scope.selectNext();
            $scope.$digest();
          }
          event.preventDefault();
        } else if (event.keyCode == UP) {
          if ($scope.hasResults()) {
            $scope.selectPrevious();
            $scope.$digest();
          }
          event.preventDefault();
        } else if (event.keyCode == ESC) {
          if ($scope.hasResults()) {
            $scope.$apply(function(scope) {
              scope.closePicker();
            });
            event.preventDefault();
          }
        } else if (event.keyCode == ENTER) {
          if ($scope.hasResults()) {
            $scope.$apply(function(scope) {
              scope.pickSelected();
            });
          }
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

      $scope.hasResults = function () {
        return $scope.entries && $scope.entries.length > 0;
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

      $scope.pick = function (entry) {
        $scope.addLink(entry, function(err) {
          if (!err) $scope.closePicker();
        });
      };

      $scope.pickSelected = function() {
        var entry = $scope.entries[$scope.selectedItem];
        if (entry) $scope.pick(entry);
      };

    }
  };
});

