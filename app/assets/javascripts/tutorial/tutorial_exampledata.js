'use strict';

angular.module('contentful').factory('tutorialExampledata', ['$q', 'environment', '$rootScope', '$timeout', 'sampleEntries', 'sampleContentTypes', 'client', 'listActions', function ($q, environment, $rootScope, $timeout, sampleEntries, sampleContentTypes, client, listActions) {
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

    switchToTutorialSpace: function (clientScope, tries) {
      var newSpaceId, self = this;
      var tutorialSpace = _.find(clientScope.spaces, function (space) {
        var isTutorialSpace = space.data.tutorial;
        var isCurrentUsersSpace = space.data.sys.createdBy.sys.id === clientScope.user.sys.id;
        var isCurrentUsersOrganization = space.data.organization.sys.createdBy.sys.id === clientScope.user.sys.id;
        return isTutorialSpace && (isCurrentUsersSpace || isCurrentUsersOrganization);
      });
      if (tutorialSpace) {
        clientScope.selectSpace(tutorialSpace);
        return $q.when(tutorialSpace);
      }

      // Prepare Space creation
      if (_.isUndefined(tries)) tries = 2;
      var tutorialOrg = _.find(clientScope.organizations, function (organization) {
        return clientScope.canCreateSpaceInOrg(organization.sys.id);
      });
      if (!tutorialOrg) return $q.reject();

      // Run Space creation
      return client.createSpace({name: 'Playground', tutorial: true}, tutorialOrg.sys.id)
      .then(function (newSpace) {
        newSpaceId = newSpace.getId();
        return clientScope.performTokenLookup();
      }).then(function () {
        var space = _.find(clientScope.spaces, function (space) { return space.getId() == newSpaceId; });
        if (space) {
          clientScope.selectSpace(space);
          return space;
        }
        if (tries <= 0) throw new Error('Could not find/create Tutorial Space');
        return $timeout(function () {
          return self.switchToTutorialSpace(clientScope, tries-1);
        }, 2000);
      });
    },

    createContentTypes: function (spaceContext) {
      return this.load().
      then(function createContentTypes(data) {
        return _.reject(data.contentTypes, function (newContentType) {
          return !!_.find(spaceContext.contentTypes, function (existingContentType) {
            return existingContentType.getId() == newContentType.sys.id;
          });
        });
      }).
      then(function(newContentTypeData){
        var createCalls = _.map(newContentTypeData, function (data) {
          return function call() {
            return spaceContext.space.createContentType(data);
          };
        });
        return listActions.serialize(createCalls);
      }).
      then(function (contentTypes) {
        var publishCalls = _.map(contentTypes, function (contentType) {
          return function () {
            return contentType.publish(contentType.getVersion());
          };
        });
        return listActions.serialize(publishCalls);
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
      then(function(entryData) {
        var createCalls = _.map(entryData, function (entry) {
          return function () {
            return spaceContext.space.createEntry(entry.sys.contentType.sys.id, entry)
            .catch(function (err) {
              if (dotty.get(err, 'body.sys.id') == 'VersionMismatch'){
                return null;
              } else {
                return $q.reject();
              }
            });
          };
        });
        return listActions.serialize(createCalls);
      }).
      then(function (entries) {
        return _.compact(entries);
      }).
      then(function (entries) {
        return $timeout(function(){ return entries; }, 3000);
      }).
      then(function publishEntries(entries) {
        var publishCalls = _.map(entries, function (entry) {
          return function () {
            return entry.publish(entry.getVersion());
          };
        });
        return listActions.serialize(publishCalls);
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
}]);

