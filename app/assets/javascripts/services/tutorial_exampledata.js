'use strict';

angular.module('contentful').factory('tutorialExampledata', function ($q, $http, environment, $rootScope, $timeout) {
  var promise;
  return {
    load: function () {
      if (!promise) {
        promise = $q.all([
          $http.get('//'+environment.settings.cdn_host + '/app/sample_data/content_types.json'),
          $http.get('//'+environment.settings.cdn_host + '/app/sample_data/entries.json')]).
        then(function (response) {
          return {
            contentTypes: response[0].data.items,
            entries: _.map(response[1].data.items, function (entry) {
              _.each(entry.fields, function (data, name) {
                entry.fields[name] = {'en-US': data};
              });
              return entry;
            })
          };
        });
      }
      return promise;
    },
      
    createContentTypes: function (spaceContext) {
      return this.load().
      then(function createContentTypes(data) {
        return $q.all(_(data.contentTypes).reject(function (newContentType) {
          return !!_.find(spaceContext.contentTypes, function (existingContentType) {
            return existingContentType.getId() == newContentType.sys.id;
          });
        }).map(function (contentType) {
          var deferred = $q.defer();
          spaceContext.space.createContentType(contentType, function (err, contentType) {
            $rootScope.$apply(function (scope) {
              if (err) return deferred.reject(err);
              contentType.publish(contentType.data.sys.version, function (err, contentType) {
                scope.$apply(function () {
                  if (err) return deferred.reject(err);
                  deferred.resolve(contentType);
                });
              });
            });
          });
          return deferred.promise;
        }).value());
      }).
      then(function (contentTypes) {
        if (contentTypes.length > 0) return $timeout(function () {
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
              if (err) return deferred.reject(err);
              deferred.resolve(entry);
            });
          });
          return deferred.promise;
        }));
      }).
      then(function (entries) {
        return $timeout(function(){
          return entries;
        }, 3000);
      }).
      then(function publishEntries(entries) {
        return $q.all(_.map(entries, function (entry) {
          var deferred = $q.defer();
          entry.publish(entry.data.sys.version, function (err, entry) {
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

