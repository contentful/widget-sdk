'use strict';

angular.module('contentful').directive('contextualHelp', ['require', function (require) {
  var $q = require('$q');
  var K = require('utils/kefir');
  var LD = require('utils/LaunchDarkly');
  var spaceContext = require('spaceContext');
  var analytics = require('analytics/Analytics');
  var SECONDS_IN_WEEK = 7 * 24 * 60 * 60;
  var moment = require('moment');

  return {
    template: '<cf-contextual-help-sidebar ng-if="showContextualHelp">',
    restrict: 'E',
    controller: ['$scope', function ($scope) {
      var testFlag = 'test-ps-07-2017-ninja-sidebar';
      var hasEntriesBus = K.createPropertyBus(false, $scope);

      updateHasEntriesBus();

      var contextualHelpTest$ = K.combine(
        [ LD.getTest(testFlag, qualifyUser), hasEntriesBus.property ],
        function (variation, hasEntries) {
          return hasEntries ? variation : null;
        }
      );

      $scope.$on('spaceTemplateCreated', updateHasEntriesBus);

      K.onValueScope($scope, contextualHelpTest$, function (variation) {
        $scope.showContextualHelp = variation;

        analytics.track('experiment:start', {
          experiment: {
            id: testFlag,
            variation: variation
          }
        });
      });

      function qualifyUser (user, spacesByOrg) {
        var org = spaceContext.getData('organization');

        return org &&
          isOrgOwner(user, org) &&
          orgHasSpace(spacesByOrg, org) &&
          isRecentUser(user);
      }

      function isOrgOwner (user, currentOrg) {
        var ownedOrgMemberships = user.organizationMemberships.filter(function (membership) {
          return membership.role === 'owner';
        });

        return !!_.find(ownedOrgMemberships, function (membership) {
          return membership.organization.sys.id === currentOrg.sys.id;
        });
      }

      function orgHasSpace (spacesByOrg, currentOrg) {
        var spacesForOrg = spacesByOrg[currentOrg.sys.id];
        return spacesForOrg && !!spacesForOrg.length;
      }

      function isRecentUser (user) {
        var creationDate = moment(user.sys.createdAt);
        var now = moment();
        var diff = now.diff(creationDate, 'seconds');

        return diff <= SECONDS_IN_WEEK;
      }

      function spaceHasEntry () {
        if (!spaceContext || !spaceContext.cma) {
          return $q.resolve(false);
        } else {
          return spaceContext.cma.getEntries().then(function (entries) {
            return !!entries.total;
          });
        }
      }

      function updateHasEntriesBus () {
        spaceHasEntry().then(function (hasEntries) {
          hasEntriesBus.set(hasEntries);
        });
      }

    }]
  };
}]);
