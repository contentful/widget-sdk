'use strict';

angular.module('contentful').factory('tutorialExampledata', function ($q, $http, environment, $rootScope, $timeout, sampleEntries, sampleContentTypes, client) {
  return {
    load: function () {
      var deferred = $q.defer();
      // TODO Without this weird timeout construct, just resolving the promise synchronously
      // we somehow get two calls to guiders.next()
      // No idea why, I guess there's some implicit assumption somewhere that this load call will be async
      $timeout(function () {
        deferred.resolve([sampleContentTypes, sampleEntries]);
      });
      return deferred.promise.then(function (response) {
        return {
          contentTypes: response[0].items,
          entries: response[1].items
        };
      });
    },
      
    switchToTutorialSpace: function (clientScope) {
      var deferred = $q.defer();
      var IS_TUTORIAL = /playground/i;
      var tutorialSpace = _.find(clientScope.spaces, function (space) {
        return space.data.membership.owner && IS_TUTORIAL.test(space.data.name);
      });
      if (tutorialSpace) {
        clientScope.selectSpace(tutorialSpace);
        deferred.resolve(tutorialSpace);
      } else {
        client.createSpace({name: 'Playground'}, function (err, newSpace) {
          clientScope.$apply(function (scope) {
            if (err) {
              deferred.reject(err);
            } else {
              scope.performTokenLookup(function () {
                var space = _.find(scope.spaces, function (space) {
                  return space.getId() == newSpace.getId();
                });
                scope.selectSpace(space);
                deferred.resolve(space);
              });
            }
          });
        });
      }
      return deferred.promise;
    },

    createContentTypes: function (spaceContext) {
      //console.log('initial call to createContentTypes');
      return this.load().
      then(function createContentTypes(data) {
        //console.log('create content types', data);
        return $q.all(_(data.contentTypes).reject(function (newContentType) {
          return !!_.find(spaceContext.contentTypes, function (existingContentType) {
            return existingContentType.getId() == newContentType.sys.id;
          });
        }).map(function (contentType) {
          var deferred = $q.defer();
          spaceContext.space.createContentType(contentType, function (err, contentType) {
            $rootScope.$apply(function (scope) {
              if (err) return deferred.reject(err);
              //console.log('created', contentType);
              contentType.publish(contentType.getVersion(), function (err, contentType) {
                scope.$apply(function () {
                  if (err) return deferred.reject(err);
                  //console.log('published content type', contentType);
                  deferred.resolve(contentType);
                });
              });
            });
          });
          return deferred.promise;
        }).value());
      }).
      then(function (contentTypes) {
        //console.log('done publishing');
        if (contentTypes.length > 0) return $timeout(function () {
          //console.log('refreshing content types');
          return spaceContext.refreshContentTypes();
        }, 3000);
      });
    },

    createEntries: function (spaceContext) {
      return this.load().
      then(function (data) {
        return data.entries;
      }).
      then(function createEntries(entries) {
        return $q.all(_.map(entries, function (entry) {
          var deferred = $q.defer();
          spaceContext.space.createEntry(entry.sys.contentType.sys.id, entry, function (err, entry) {
            $rootScope.$apply(function () {
              if (err && !(err.body && err.body.sys && err.body.sys.id == 'VersionMismatch')) return deferred.reject(err);
              deferred.resolve(entry);
            });
          });
          return deferred.promise;
        }));
      }).
      then(function (entries) {
        return _.compact(entries);
      }).
      then(function (entries) {
        return $timeout(function(){
          return entries;
        }, 3000);
      }).
      then(function publishEntries(entries) {
        return $q.all(_.map(entries, function (entry) {
          var deferred = $q.defer();
          entry.publish(entry.getVersion(), function (err, entry) {
            $rootScope.$apply(function () {
              if (err) return deferred.reject(err);
              deferred.resolve(entry);
            });
          });
          return deferred.promise;
        }));
      });
    },

    createEntriesWithContentTypes: function (spaceContext) {
      var self = this;
      return this.createContentTypes(spaceContext).
      then(function () {
        return self.createEntries(spaceContext);
      });
    }
  };
});

