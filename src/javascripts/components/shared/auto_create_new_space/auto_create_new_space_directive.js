'use strict';

angular.module('contentful')
.directive('cfAutoCreateNewSpace', function () {
  return {
    restrict: 'A',
    scope: {},
    controller: ['$scope', 'require', function ($scope, require) {
      var $q = require('$q');
      var $rootScope = require('$rootScope');
      var theStore = require('TheStore');
      var modalDialog = require('modalDialog');
      var LD = require('utils/LaunchDarkly');
      var K = require('utils/kefir');
      var moment = require('moment');
      var client = require('client');
      var spaceContext = require('spaceContext');
      var spaceTemplateLoader = require('spaceTemplateLoader');
      var spaceTemplateCreator = require('spaceTemplateCreator');
      var tokenStore = require('services/TokenStore');
      var nav = require('states/Navigator');
      var spaceTemplateEvents = require('analytics/events/SpaceCreation');

      var autoCreateSpaceTemplate = require('components/shared/auto_create_new_space/auto_create_new_space.template').default();

      var testName = 'test-ps-07-2017-auto-create-space';
      var test$ = LD.getTest(testName, qualifyUser);
      var user$ = tokenStore.user$;
      var spacesByOrganization$ = tokenStore.spacesByOrganization$;

      K.onValueScope($scope, test$, function (shouldAutoCreateNewSpace) {
        var spaceAutoCreated = theStore.get(testName + ':spaceAutoCreated');

        // TODO: do a debounced create space so as to take the latest value
        // of the test flag and not some old stale value
        if (shouldAutoCreateNewSpace && !spaceAutoCreated && !$scope.isCreatingSpace) {
          createSpace();
        }
      });

      function createSpace () {
        $scope.isCreatingSpace = true;
        spaceTemplateLoader.getTemplatesList()
          // choose template
          .then(function (templates) {
            return _.find(templates, function (t) {
              return t.fields.name.toLowerCase() === 'product catalogue';
            }).fields;
          })
          // bring up dialog
          .then(function (v) {
            modalDialog.open({
              title: 'Space auto creation',
              template: autoCreateSpaceTemplate,
              backgroundClose: false,
              persistOnNavigation: true,
              scope: $scope
            });

            return v;
          })
          // create space
          .then(function (template) {
            var org = getFirstOwnedOrgWithoutSpaces(K.getValue(user$), K.getValue(spacesByOrganization$));
            var data = {
              name: 'Demo catalogue',
              defaultLocale: 'en-US'
            };

            return client
              .createSpace(data, org.sys.id)
              .catch(function (e) {
                return $q.reject(e);
              })
              .then(function (newSpace) {
                tokenStore.refresh();
                return { newSpace: newSpace, template: template };
              });
          })
          // go to new space
          .then(function (v) {
            var newSpace = v.newSpace;

            return tokenStore
              .getSpace(newSpace.getId())
              .then(function (space) {
                return nav.go({
                  path: ['spaces', 'detail'],
                  params: {
                    spaceId: space.getId()
                  }
                });
              })
              // pass new space and template down the chain
              .then(function () {
                return v;
              });
          })
          // setup before loading template
          .then(function (v) {
            var selectedTemplate = v.template;
            var itemHandlers = {
              // no need to show status of individual items
              onItemSuccess: spaceTemplateEvents.entityActionSuccess,
              onItemError: _.noop
            };
            var templateLoader = spaceTemplateCreator.getCreator(
              spaceContext,
              itemHandlers,
              selectedTemplate.name
            );

            return spaceTemplateLoader
              .getTemplate(selectedTemplate)
              .then(function (template, retried) {
                return {
                  template: template,
                  retried: retried,
                  templateLoader: templateLoader
                };
              });
          })
          // load template into space
          // handle v.retried
          .then(function loadTemplateIntoSpace (v) {
            var template = v.template;
            var templateLoader = v.templateLoader;

            return templateLoader
              .create(template)
              .then(function () {
                return spaceContext.publishedCTs.refresh();
              })
              .then(function () {
                $rootScope.$broadcast('spaceTemplateCreated');
              })
              .then(function () {
                theStore.set(testName + ':spaceAutoCreated', true);
              });
          })
          .catch(function (e) {
            $scope.autoSpaceCreationFailed = true;
            $scope.autoSpaceCreationError = e;
          })
          .finally(function () {
            $scope.isCreatingSpace = false;
          });
      }

      function qualifyUser (user, spacesByOrg) {
        // to be qualified, the user's age must b
        return isRecentUser(user) && !hasAnOrgWithSpaces(spacesByOrg);
      }

      function hasAnOrgWithSpaces (spacesByOrg) {
        return _.find(spacesByOrg, function (spaces) {
          return spaces.length;
        });
      }

      // qualify a user if it was created in the last week
      function isRecentUser (user) {
        var secondsInAWeek = 7 * 24 * 60 * 60;
        var creationDate = moment(user.sys.createdAt);
        var now = moment();
        var diff = now.diff(creationDate, 'seconds');

        return diff >= secondsInAWeek;
      }

      function getFirstOwnedOrgWithoutSpaces (user, spacesByOrg) {
        var organizationMemberships = user.organizationMemberships;
        // filter out orgs user owns
        var ownedOrgs = organizationMemberships.filter(function (org) {
          return org.role === 'owner';
        });

        // return the first org that has no spaces
        var orgMembership = _.find(ownedOrgs, function (ownedOrg) {
          var spacesForOrg = spacesByOrg[ownedOrg.sys.id];

          return !spacesForOrg || spacesForOrg.length === 0;
        });

        return orgMembership && orgMembership.organization;
      }
    }]
  };
});
