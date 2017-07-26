'use strict';

angular.module('contentful')
.directive('cfAutoCreateNewSpace', function () {
  return {
    restrict: 'A',
    scope: {},
    controller: ['$scope', 'require', function ($scope, require) {
      var $rootScope = require('$rootScope');
      var $q = require('$q');
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
      var analytics = require('analytics/Analytics');
      var spaceTemplateEvents = require('analytics/events/SpaceCreation');

      var autoCreateSpaceTemplate = require('components/shared/auto_create_new_space/auto_create_new_space.template').default();

      var testName = 'test-ps-07-2017-auto-create-space';
      var test$ = LD.getTest(testName, qualifyUser);
      var user$ = tokenStore.user$.filter(function (user) {
        return !!user;
      });
      // emit user with every test value that is emitted
      // null user's are filtered out above so you will
      // always get a truthy user (the user object)
      var testAndUser$ = K.combine([test$], [user$], function (testFlag, user) {
        return { testFlag: testFlag, user: user };
      });
      var spacesByOrganization$ = tokenStore.spacesByOrganization$;

      var theStore = require('TheStore');

      var SECONDS_IN_WEEK = 7 * 24 * 60 * 60;
      var dialog, myStore;


      K.onValueScope($scope, testAndUser$, function (value) {
        myStore = theStore.forKey(testName + ':' + value.user.sys.id + ':spaceAutoCreated');

        var shouldAutoCreateNewSpace = value.testFlag;
        var spaceAutoCreated = myStore.get();

        if (shouldAutoCreateNewSpace && !spaceAutoCreated && !$scope.isCreatingSpace) {
          createSpace();
        }

        if (!shouldAutoCreateNewSpace) {
          trackExperiment(shouldAutoCreateNewSpace);
        }
      });

      function trackExperiment (variation) {
        analytics.track('experiment:start', {
          experiment: {
            id: testName,
            variation: variation
          }
        });
      }

      function createSpace () {
        $scope.isCreatingSpace = true;
        spaceTemplateLoader.getTemplatesList()
          // choose template
          .then(chooseTemplate)
          // bring up dialog
          .then(openDialog)
          // create space
          .then(createEmptySpace)
          // go to new space
          .then(gotoNewSpace)
          // setup before loading template
          .then(preTemplateLoadSetup)
          // load template into space
          // handle v.retried
          .then(loadTemplateIntoSpace)
          // track variation seen by user
          // this is done at the end so that we only
          // trigger analytics for those users who saw
          // the completion of the test. I.e., users for whom
          // auto creation was successful
          .then(function () {
            trackExperiment(true);
          })
          // handle error
          .catch(handleSpaceAutoCreateError)
          .finally(function () {
            $scope.isCreatingSpace = false;
          });
      }

      function chooseTemplate (templates) {
        return _.find(templates, function (t) {
          return t.fields.name.toLowerCase() === 'product catalogue';
        }).fields;
      }

      function openDialog (template) {
        dialog = modalDialog.open({
          title: 'Space auto creation',
          template: autoCreateSpaceTemplate,
          backgroundClose: false,
          persistOnNavigation: true,
          scope: $scope
        });

        return template;
      }

      function createEmptySpace (template) {
        var org = getFirstOwnedOrgWithoutSpaces(K.getValue(user$), K.getValue(spacesByOrganization$));
        var data = {
          name: 'Demo catalogue',
          defaultLocale: 'en-US'
        };

        if (!org) {
          return $q.reject(new Error('No owned org found'));
        }

        return client
          .createSpace(data, org.sys.id)
          .then(function (newSpace) {
            return tokenStore
              .refresh()
              .then(function () {
                return { newSpace: newSpace, template: template };
              });
          });
      }

      function gotoNewSpace (newSpaceAndTemplate) {
        return tokenStore
          .getSpace(newSpaceAndTemplate.newSpace.getId())
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
            return newSpaceAndTemplate;
          });
      }

      function preTemplateLoadSetup (newSpaceAndTemplate) {
        var selectedTemplate = newSpaceAndTemplate.template;
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
      }

      function loadTemplateIntoSpace (v) {
        return v.templateLoader
          .create(v.template)
          .then(function () {
            return spaceContext.publishedCTs.refresh();
          })
          .then(function () {
            $rootScope.$broadcast('spaceTemplateCreated');
            myStore.set(true);
          });
      }

      function handleSpaceAutoCreateError (e) {
        $scope.autoSpaceCreationError = e;
        dialog.cancel();
      }

      function qualifyUser (user, spacesByOrg) {
        return isRecentUser(user) && !hasAnOrgWithSpaces(spacesByOrg);
      }

      function hasAnOrgWithSpaces (spacesByOrg) {
        return _.find(spacesByOrg, function (spaces) {
          return spaces.length;
        });
      }

      // qualify a user if it was created in the last week
      function isRecentUser (user) {
        var creationDate = moment(user.sys.createdAt);
        var now = moment();
        var diff = now.diff(creationDate, 'seconds');

        return diff <= SECONDS_IN_WEEK;
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
