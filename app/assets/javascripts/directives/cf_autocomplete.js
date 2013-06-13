angular.module('contentful').directive('cfAutocomplete', function(Paginator, ShareJS, cfSpinner, validation, $parse, notification){
  'use strict';

  return {
    restrict: 'A',
    require: 'ngModel',
    template: JST['cf_autocomplete'],
    link: function($scope, element, attrs, ngModelCtrl) {
      $scope.linkedEntries = []; //contains the linked Entry

      var ngModelGet = $parse(attrs.ngModel),
          ngModelSet = ngModelGet.assign;

      var validations = $scope.field.type === 'Array' && $scope.field.items.validations ?
        $scope.field.items.validations :
        $scope.field.validations;
      var linkContentTypeValidation = _(validations)
        .map(validation.Validation.parse)
        .where({name: 'linkContentType'})
        .first();

      if (linkContentTypeValidation) {
        $scope.linkContentType = _.find($scope.spaceContext.publishedContentTypes, function(et) {
          return et.getId() == linkContentTypeValidation.contentTypeId;
        });
      }

      $scope.removeLink = function(entry) {
        if (attrs.cfAutocomplete === 'entry') {
          return $scope.otChangeValue(null, function(err) {
            if (!err) $scope.$apply(function () {
              ngModelCtrl.$setViewValue(null);
            });
          });
        } else {
          var entryIndex = _.indexOf($scope.linkedEntries, entry);
          $scope.otDoc.at($scope.otPath.concat(entryIndex)).remove(function (err) {
            if (!err) $scope.$apply(function(scope) {
              scope.linkedEntries.splice(entryIndex,1);
              ngModelCtrl.$setViewValue(linksFromEntries(scope.linkedEntries));
            });
          });
        }
      };

      $scope.addLink = function(entry, callback) {
        var link = {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: entry.getId()
          }
        };
        if (attrs.cfAutocomplete === 'entry') {
          $scope.otChangeValue(link, function(err) {
            $scope.$apply(function(scope) {
              if (err) {
                callback(err);
              } else {
                scope.linkedEntries = [entry];
                ngModelCtrl.$setViewValue(linksFromEntries(scope.linkedEntries));
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
                  ngModelCtrl.$setViewValue(linksFromEntries(scope.linkedEntries));
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
                  ngModelCtrl.$setViewValue(linksFromEntries(scope.linkedEntries));
                  callback(null);
                }
              });
            });
          }
        }

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

      $scope.setLinkedEntriesFromValue = function entriesFromLinks(value) {
        var stopSpin;
        if (attrs.cfAutocomplete === 'entries') {
          // TODO case where value is null? Shouldn't occur, but still...
          var ids = _.map(value, function (link) { return link.sys.id; }).join(',');
          stopSpin = cfSpinner.start();
          $scope.spaceContext.space.getEntries({'sys.id[in]': ids}, function (err, entries) {
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
            if (value.sys.linkType == 'Entry') {
              stopSpin = cfSpinner.start();
              $scope.spaceContext.space.getEntry(linkedId, function(err, entry) {
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

      function linksFromEntries(entries) {
        var list = _.map(entries, function (entry) {
          return { sys: {
            type: 'Link',
            linkType: 'Entry',
            id: entry.getId() } };
        });

        if (attrs.cfAutocomplete === 'entries') {
          return list;
        } else {
          return list[0];
        }
      }

      ngModelCtrl.$render = function () {
        $scope.setLinkedEntriesFromValue(ngModelCtrl.$viewValue);
      };

      $scope.$on('otValueChanged', function(event, path, value) {
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, value);
      });

      $scope.linkDescription= function(entry) {
        if (entry) {
          return $scope.spaceContext.entryTitle(entry, $scope.locale.code);
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
        $scope.spaceContext.space.getEntries($scope.buildQuery(), function(err, entries, stats) {
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

        if ($scope.linkContentType)
          queryObject['sys.contentType.sys.id'] = $scope.linkContentType.getId();

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
        $scope.spaceContext.space.getEntries($scope.buildQuery(), function(err, entries, stats) {
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

