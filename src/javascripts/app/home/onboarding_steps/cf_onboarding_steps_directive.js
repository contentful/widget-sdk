'use strict';

angular.module('contentful')
.directive('cfOnboardingSteps', ['require', function (require) {
  var $state = require('$state');
  var Analytics = require('analytics/Analytics');
  var template = require('app/home/onboarding_steps/OnboardingStepsTemplate').default;
  var spaceContext = require('spaceContext');
  var WebhookRepository = require('WebhookRepository');
  var CreateSpace = require('services/CreateSpace');
  var caseofEq = require('sum-types').caseofEq;
  var TheLocaleStore = require('TheLocaleStore');
  var entityCreator = require('entityCreator');
  // Begin test code: test-ps-02-2018-tea-onboarding-steps
  var LD = require('utils/LaunchDarkly');
  var K = require('utils/kefir');
  var contentPreviewsBus$ = require('contentPreview').contentPreviewsBus$;
  var isExampleSpaceFlagName = 'test-ps-02-2018-tea-onboarding-steps';
  // End test code: test-ps-02-2018-tea-onboarding-steps

  return {
    template: template(),
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      var controller = this;

      // Begin test code: test-ps-02-2018-tea-onboarding-steps
      if (spaceContext.space) {
        controller.isExampleSpace = 'loading';
        controller.isContentPreviewsLoading = true;

        // we convert property to a stream in order to get the next, not current value
        var previewBusPromise = new Promise(function (resolve) {
          K.onValueScope($scope, contentPreviewsBus$.changes(), resolve);
        });
        var sleepPromise = new Promise(function (resolve) {
          // we wait for 3000ms since content previews are being polled every 2500ms,
          // and request should take 500ms at most
          setTimeout(resolve, 3000);
        });

        Promise.race([
          // this value might be resolved before we run this code, and later we skip duplicates
          // so it means it will never resolve this promise in our controller
          // next promise handles exactly that situation
          previewBusPromise,
          // content previews are updated every 2.5 seconds, so this promise is needed
          // to indicate that we've loaded before this controller
          sleepPromise
        ]).then(function () {
          // after this value is updated, LD sends new info to its servers
          // and then LD flag value is updated. So we need to wait some time
          // empirically, 200ms is enough for 3G - this is a dirty hack
          setTimeout(function () {
            controller.isContentPreviewsLoading = false;
            $scope.$apply();
          }, 200);
        });

        LD.onABTest($scope, isExampleSpaceFlagName, function (flag) {
          controller.isExampleSpace = flag;
          // if user is not qualified, we don't send this value
          if (flag !== null) {
            Analytics.track('experiment:start', {
              experiment: {
                id: isExampleSpaceFlagName,
                variation: flag
              }
            });
          }
        });
      } else {
        controller.isExampleSpace = false;
        controller.isContentPreviewsLoading = false;
      }
      // End test code: test-ps-02-2018-tea-onboarding-steps

      var firstSteps = [
        {
          id: 'create_space',
          title: 'Create a space',
          description: 'A space is a place where you keep all the content related to a single project.',
          cta: 'Create space',
          icon: 'space',
          action: makeAction(CreateSpace.showDialog, 'Create space')
        },
        {
          id: 'create_content_type',
          title: 'Define the structure',
          description: 'Create your content model. It’s comprised of content types, which define the structure of your entries.',
          cta: 'Create a content type',
          icon: 'page-ct',
          link: {
            text: 'View content model',
            state: 'spaces.detail.content_types.list'
          },
          action: makeAction(addContentType, 'Create a content type')
        },
        {
          id: 'create_entry',
          title: 'Create your content',
          description: 'Add an entry. They are your actual pieces of content, based on the content types you have created.',
          cta: 'Add an entry',
          icon: 'page-content',
          link: {
            text: 'View content',
            state: 'spaces.detail.entries.list'
          },
          action: makeAction(addEntry, 'Add an entry')
        },
        {
          id: 'use_api',
          title: 'Fetch your content',
          description: 'Use the API to see your content wherever you like. We’ll show you different ways of delivering your content.',
          cta: 'Use the API',
          icon: 'page-apis',
          action: makeAction(goToApiKeySection, 'Use the API')
        }
      ];

      var advancedSteps = [
        {
          id: 'invite_user',
          title: 'Invite users',
          description: 'Invite your teammates to the space to get your project off the ground.',
          cta: 'Invite users',
          icon: 'onboarding-add-user',
          link: {
            text: 'View users',
            state: 'spaces.detail.settings.users.list'
          },
          action: makeAction(goToSettings('users'), 'Invite users')
        },
        {
          id: 'add_locale',
          title: 'Locales',
          description: 'Set up locales to manage and deliver content in different languages.',
          cta: 'Add locales',
          icon: 'onboarding-locales',
          link: {
            text: 'View locales',
            state: 'spaces.detail.settings.locales.list'
          },
          action: makeAction(goToSettings('locales'), 'Add locales')
        },
        {
          id: 'create_webhook',
          title: 'Webhooks',
          description: 'Configure webhooks to send requests triggered by changes to your content.',
          cta: 'Add webhooks',
          icon: 'onboarding-webhooks',
          link: {
            text: 'View webhooks',
            state: 'spaces.detail.settings.webhooks.list'
          },
          action: makeAction(goToSettings('webhooks'), 'Add webhooks')
        }
      ];

      function makeAction (action, cta) {
        return function () {
          Analytics.track('learn:step_clicked', {linkName: cta});
          action();
        };
      }

      caseofEq($state.current.name, [
        ['home', initHomePage],
        ['spaces.detail.home', function () {
          initSpaceHomePage();
          // Refresh after new space creation as content types and entries might have been created
          $scope.$on('spaceTemplateCreated', initSpaceHomePage);
        }]
      ]);

      function initHomePage () {
        controller.steps = firstSteps;
        setStepCompletion(0);
      }

      function initSpaceHomePage () {
        var hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;
        var isActivated = !!spaceContext.getData('activatedAt');
        var showAdvancedSteps = isActivated && hasContentTypes;

        if (showAdvancedSteps) {
          controller.steps = advancedSteps;
          setAdvancedStepsCompletion();
        } else {
          controller.steps = firstSteps;
          setOnboardingStepsCompletion();
        }
      }

      function setOnboardingStepsCompletion () {
        var hasContentTypes = spaceContext.publishedCTs.getAllBare().length > 0;

        if (hasContentTypes) {
          spaceContext.space.getEntries().then(function (entries) {
            var hasEntries = !!_.size(entries);
            var nextStep = hasEntries ? 3 : 2;
            setStepCompletion(nextStep);
          });
        } else {
          setStepCompletion(1);
        }
      }

      function setStepCompletion (nextStepIdx) {
        // Set previous steps to completed and disable future steps
        // This is for the first page only
        firstSteps.forEach(function (step, i) {
          step.disabled = false;
          step.completed = i < nextStepIdx;

          if (i > nextStepIdx) {
            step.disabled = true;
          }
        });
      }

      function setAdvancedStepsCompletion () {
        advancedSteps[1].completed = TheLocaleStore.getLocales().length > 1;

        spaceContext.endpoint({
          method: 'GET',
          path: ['users']
        }).then(function (res) {
          controller.steps[0].completed = res.items.length > 1;
        });

        WebhookRepository.getInstance(spaceContext.space).getAll()
        .then(function (webhooks) {
          controller.steps[2].completed = webhooks.length > 0;
        });
      }

      function addContentType () {
        $state.go('spaces.detail.content_types.new');
      }

      function addEntry () {
        var contentTypes = spaceContext.publishedCTs.getAllBare();

        if (contentTypes.length === 1) {
          var contentTypeId = contentTypes[0].sys.id;
          var contentType = spaceContext.publishedCTs.get(contentTypeId);
          entityCreator.newEntry(contentTypeId)
          .then(function (entry) {
            Analytics.track('entry:create', {
              eventOrigin: 'onboarding',
              contentType: contentType,
              response: entry
            });
            $state.go('spaces.detail.entries.detail', {entryId: entry.getId()});
          });
        } else {
          $state.go('spaces.detail.entries.list');
        }
      }

      // Clicking `Use the API` goes to the delivery API key if there is exactly
      // one otherwise API home
      function goToApiKeySection () {
        spaceContext.apiKeyRepo.getAll()
        .then(function (keys) {
          if (keys.length === 1) {
            var name = 'spaces.detail.api.keys.detail';
            var params = { apiKeyId: keys[0].sys.id };
            $state.go(name, params);
          } else {
            $state.go('spaces.detail.api.keys.list');
          }
        });
      }

      function goToSettings (page) {
        return function () {
          $state.go('spaces.detail.settings.' + page + '.list');
        };
      }
    }],
    controllerAs: 'onboarding'
  };
}]);
