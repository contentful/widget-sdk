'use strict';

angular.module('contentful').factory('tutorialExampledata', function ($q, environment, $rootScope, $timeout, sampleEntries, sampleContentTypes, client) {
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
      var ccb, newSpaceId, self = this;
      var tutorialSpace = _.find(clientScope.spaces, function (space) {
        var isTutorialSpace = space.data.tutorial;
        var isCurrentUsersSpace = space.data.organization.sys.createdBy.sys.id === clientScope.user.sys.id;
        return isCurrentUsersSpace && isTutorialSpace;
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
      client.createSpace({name: 'Playground', tutorial: true}, tutorialOrg.sys.id, ccb = $q.callback());
      return ccb.promise.then(function (newSpace) {
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
        return $q.all(_(data.contentTypes).reject(function (newContentType) {
          return !!_.find(spaceContext.contentTypes, function (existingContentType) {
            return existingContentType.getId() == newContentType.sys.id;
          });
        }).map(function (contentType) {
          var ccb = $q.callback();
          spaceContext.space.createContentType(contentType, ccb);
          return ccb.promise.then(function (contentType) {
            var pcb = $q.callback();
            contentType.publish(contentType.getVersion(), pcb);
            return pcb.promise;
          });
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
          var ccb = $q.callback();
          spaceContext.space.createEntry(entry.sys.contentType.sys.id, entry, ccb);
          return ccb.promise.catch(function (err) {
            if (err && err.body && err.body.sys && err.body.sys.id == 'VersionMismatch'){
              return null;
            } else {
              return $.reject();
            }
          });
        }));
      }).
      then(function (entries) {
        return _.compact(entries);
      }).
      then(function (entries) {
        return $timeout(function(){ return entries; }, 3000);
      }).
      then(function publishEntries(entries) {
        return $q.all(_.map(entries, function (entry) {
          var pcb = $q.callback();
          entry.publish(entry.getVersion(), pcb);
          return pcb.promise;
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

